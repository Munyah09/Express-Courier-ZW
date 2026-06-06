/**
 * HandoverPage — used when a parcel changes hands.
 * The person handing over scans / enters the tracking number,
 * selects the receiver, adds location context, and both parties sign.
 * Creates a custody_transfer record and sends a WhatsApp update.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { SignaturePad } from '../components/SignaturePad';
import { useParcelTrack } from '../hooks/useQueries';

const TRANSFER_TYPES = [
  { v: 'intake',           label: 'Intake at Branch',       icon: '📥', desc: 'First receipt when parcel arrives at branch' },
  { v: 'branch_to_driver', label: 'Branch → Driver',        icon: '🚚', desc: 'Loading onto delivery vehicle' },
  { v: 'driver_to_driver', label: 'Driver → Driver',        icon: '🔄', desc: 'Relay — vehicle swap en route' },
  { v: 'driver_to_branch', label: 'Driver → Branch',        icon: '🏢', desc: 'Offload at relay or destination branch' },
  { v: 'last_mile',        label: 'Last Mile Delivery',     icon: '🛵', desc: 'Final handoff to customer' },
  { v: 'failed_return',    label: 'Failed — Returning',     icon: '↩️', desc: 'Delivery failed, returning to sender' },
  { v: 'customer_pickup',  label: 'Customer Collection',    icon: '🙋', desc: 'Customer collecting from collection point' },
];

const CONDITION_OPTS = [
  { v: 'good',               label: 'Good condition',          color: 'bg-green-100 text-green-700 border-green-300' },
  { v: 'damaged',            label: 'Damaged',                 color: 'bg-red-100 text-red-700 border-red-300' },
  { v: 'suspected_damaged',  label: 'Suspected damage',        color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { v: 'missing_contents',   label: 'Missing contents',        color: 'bg-red-200 text-red-800 border-red-400' },
];

function useDrivers() {
  return useQuery({
    queryKey: ['users', 'drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*, role:roles(id, name)').eq('is_active', true);
      if (error) throw error;
      return (data ?? []).filter((u: any) => {
        const role: any = Array.isArray(u.role) ? u.role[0] : u.role;
        return ['driver','shop_assistant','clerk','branch_manager','admin'].includes(role?.name);
      });
    },
  });
}

function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('registration');
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useCreateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parcelId, payload }: { parcelId: string; payload: any }) => {
      const { data, error } = await supabase.from('custody_transfers').insert({
        parcel_id: parcelId,
        from_location: payload.fromLocation,
        to_user_id: payload.toUserId || null,
        to_location: payload.toLocation || null,
        to_vehicle_id: payload.toVehicleId || null,
        transfer_type: payload.transferType,
        parcel_condition: payload.parcelCondition,
        from_signature: payload.fromSignature,
        notes: payload.notes || null,
        transferred_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custody'] }),
  });
}

export function HandoverPage() {
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();

  const [trackingInput, setTrackingInput]   = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [transferType, setTransferType]     = useState('branch_to_driver');
  const [toUserId, setToUserId]             = useState('');
  const [toVehicleId, setToVehicleId]       = useState('');
  const [fromLocation, setFromLocation]     = useState('');
  const [toLocation, setToLocation]         = useState('');
  const [condition, setCondition]           = useState('good');
  const [notes, setNotes]                   = useState('');
  const [fromSignature, setFromSignature]   = useState<string | null>(null);
  const [toSignature, setToSignature]       = useState<string | null>(null);
  const [step, setStep]                     = useState<'scan' | 'details' | 'sign' | 'done'>('scan');
  const [completedTransfer, setCompletedTransfer] = useState<any>(null);

  const { data: parcel, isError: parcelNotFound } = useParcelTrack(trackingSearch);
  const { data: drivers = [] }  = useDrivers();
  const { data: vehicles = [] } = useVehicles();
  const createHandover = useCreateHandover();

  const handleScan = () => {
    const t = trackingInput.trim().toUpperCase();
    if (!t) { notify('Enter a tracking number', 'error'); return; }
    setTrackingSearch(t);
    if (parcel || !parcelNotFound) setStep('details');
  };

  const handleDetailsNext = () => {
    if (!fromLocation) { notify('Current location is required', 'error'); return; }
    setStep('sign');
  };

  const handleSubmit = async () => {
    if (!fromSignature) { notify('Handover party must sign', 'error'); return; }
    if (!parcel?.id) return;

    try {
      const result = await createHandover.mutateAsync({
        parcelId: parcel.id,
        payload: {
          fromLocation,
          toUserId:       toUserId   || undefined,
          toLocation:     toLocation || undefined,
          toVehicleId:    toVehicleId || undefined,
          transferType,
          parcelCondition: condition,
          fromSignature,
          notes: notes || undefined,
        },
      });

      // If receiver signed too, acknowledge immediately
      if (toSignature && result?.id) {
        await supabase.from('custody_transfers').update({
          to_signature: toSignature,
          to_location: toLocation || null,
          parcel_condition: condition,
          acknowledged_at: new Date().toISOString(),
        }).eq('id', result.id);
      }

      // Update parcel status based on transfer type
      const statusMap: Record<string, string> = {
        intake:           'Accepted',
        branch_to_driver: 'In Transit',
        driver_to_driver: 'In Transit',
        driver_to_branch: 'In Transit',
        last_mile:        'Out For Delivery',
        failed_return:    'Failed',
        customer_pickup:  'Delivered',
      };
      if (statusMap[transferType] && parcel?.id) {
        await supabase.from('parcels').update({ status: statusMap[transferType], current_location: fromLocation }).eq('id', parcel.id);
        await supabase.from('parcel_events').insert({
          parcel_id: parcel.id,
          event_type: 'status_change',
          event_description: `Status changed to ${statusMap[transferType]} via handover from ${fromLocation}`,
          location: fromLocation,
        });
      }

      setCompletedTransfer(result);
      setStep('done');
      notify('Handover recorded successfully', 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to record handover', 'error');
    }
  };

  const reset = () => {
    setTrackingInput(''); setTrackingSearch(''); setStep('scan');
    setFromSignature(null); setToSignature(null); setCompletedTransfer(null);
    setFromLocation(''); setToLocation(''); setToUserId(''); setToVehicleId('');
    setNotes(''); setCondition('good');
  };

  const SEL = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-400 focus:outline-none';
  const INP = `${SEL} placeholder-slate-400`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Parcel Handover</h1>
        <p className="mt-0.5 text-sm text-slate-500">Record a signed transfer of custody between handlers</p>
      </div>

      {/* Step: Scan */}
      {step === 'scan' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Step 1 — Identify Parcel</h2>
          <div className="flex gap-3">
            <input
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="Scan or enter tracking number"
              className={`flex-1 ${INP} font-mono`}
            />
            <button onClick={handleScan} className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600">
              Find →
            </button>
          </div>

          {parcelNotFound && trackingSearch && (
            <p className="text-sm text-red-600">Parcel not found: {trackingSearch}</p>
          )}

          {parcel && (
            <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-1">Parcel Found</p>
              <p className="font-mono text-lg font-black text-slate-900">{parcel.tracking_number}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Sender</p>
                  <p className="font-medium">{(parcel.sender as any)?.first_name} {(parcel.sender as any)?.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Receiver</p>
                  <p className="font-medium">{(parcel.receiver as any)?.first_name} {(parcel.receiver as any)?.last_name}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${parcel.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {parcel.status}
                </span>
              </div>
              <button onClick={() => setStep('details')} className="mt-3 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
                Continue →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Transfer Details */}
      {step === 'details' && parcel && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Step 2 — Transfer Details</h2>
            <span className="font-mono text-xs text-slate-400">{parcel.tracking_number}</span>
          </div>

          {/* Transfer type */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transfer Type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRANSFER_TYPES.map(t => (
                <button key={t.v} type="button" onClick={() => setTransferType(t.v)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${transferType === t.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="text-xl shrink-0">{t.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${transferType === t.v ? 'text-brand-700' : 'text-slate-900'}`}>{t.label}</p>
                    <p className="text-[10px] text-slate-500">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Handing-over party info */}
          <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Handing Over (You: {user?.firstName} {user?.lastName})</p>
            <input value={fromLocation} onChange={e => setFromLocation(e.target.value)}
              placeholder="Current location / where you are now *  (e.g. Harare Main Depot, Roadblock near Mvurwi turnoff)"
              className={INP} />
          </div>

          {/* Receiving party */}
          <div className="rounded-2xl bg-brand-50 p-4 space-y-2 border border-brand-200">
            <p className="text-xs font-bold text-brand-600 uppercase">Receiving Party</p>
            <select value={toUserId} onChange={e => setToUserId(e.target.value)} className={SEL}>
              <option value="">Select receiver (optional)</option>
              {drivers.map((d: any) => {
                const role: any = Array.isArray(d.role) ? d.role[0] : d.role;
                return <option key={d.id} value={d.id}>{d.first_name} {d.last_name} — {role?.name?.replace(/_/g,' ')}</option>;
              })}
            </select>
            <select value={toVehicleId} onChange={e => setToVehicleId(e.target.value)} className={SEL}>
              <option value="">Assign to vehicle (optional)</option>
              {(vehicles as any[]).map((v: any) => (
                <option key={v.id} value={v.id}>{v.registration} — {v.type} {v.make_model ? `(${v.make_model})` : ''}</option>
              ))}
            </select>
            <input value={toLocation} onChange={e => setToLocation(e.target.value)}
              placeholder="Destination / next stop  (e.g. Bulawayo Depot, Customer at Nkulumane 7)"
              className={INP} />
          </div>

          {/* Condition */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Parcel Condition</p>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTS.map(c => (
                <button key={c.v} type="button" onClick={() => setCondition(c.v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${condition === c.v ? c.color : 'border-slate-200 text-slate-600'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Notes (optional)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Any observations, damages, special notes…"
              className={`${INP} resize-none`} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('scan')} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">← Back</button>
            <button onClick={handleDetailsNext} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600">Sign & Complete →</button>
          </div>
        </div>
      )}

      {/* Step: Signatures */}
      {step === 'sign' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Step 3 — Signatures</h2>
            <span className="font-mono text-xs text-slate-400">{parcel?.tracking_number}</span>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-700">⚠️ Legal Record</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Both parties' signatures create a binding chain-of-custody record.
              By signing you confirm receipt/transfer of this parcel.
            </p>
          </div>

          {/* Handover signature */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Handover Signature — {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 mb-3">
              I confirm I am handing over parcel <strong>{parcel?.tracking_number}</strong> from <strong>{fromLocation}</strong>
              {toLocation ? ` to ${toLocation}` : ''} in <strong>{CONDITION_OPTS.find(c => c.v === condition)?.label}</strong> condition.
            </p>
            <SignaturePad
              label="Sign to confirm handover"
              onSave={setFromSignature}
              onClear={() => setFromSignature(null)}
              existingSignature={fromSignature}
            />
          </div>

          {/* Receiver signature (optional — can be added later via acknowledge) */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Receiver Signature
              <span className="ml-2 text-xs font-normal text-slate-400">(optional — can be added later)</span>
            </p>
            <p className="text-xs text-slate-500 mb-3">
              If the receiver is present, they sign here to acknowledge receipt.
            </p>
            <SignaturePad
              label="Receiver signs to confirm receipt"
              onSave={setToSignature}
              onClear={() => setToSignature(null)}
              existingSignature={toSignature}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('details')} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">← Back</button>
            <button
              onClick={handleSubmit}
              disabled={!fromSignature || createHandover.isPending}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {createHandover.isPending ? 'Recording…' : '✅ Record Handover'}
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && completedTransfer && (
        <div className="rounded-3xl border-2 border-green-400 bg-green-50 p-6 shadow-sm text-center space-y-4">
          <div className="text-5xl">✅</div>
          <div>
            <h2 className="text-xl font-bold text-green-900">Handover Recorded</h2>
            <p className="text-sm text-green-700 mt-1">
              Transfer ID: <span className="font-mono">{completedTransfer.id?.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-left rounded-2xl bg-white p-4 border border-green-200">
            <div><p className="text-xs text-slate-400">From</p><p className="font-medium">{fromLocation}</p></div>
            <div><p className="text-xs text-slate-400">To</p><p className="font-medium">{toLocation || '—'}</p></div>
            <div><p className="text-xs text-slate-400">Type</p><p className="font-medium">{TRANSFER_TYPES.find(t => t.v === transferType)?.label}</p></div>
            <div><p className="text-xs text-slate-400">Condition</p><p className="font-medium">{CONDITION_OPTS.find(c => c.v === condition)?.label}</p></div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={async () => {
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                const pageW = doc.internal.pageSize.getWidth();
                const pageH = doc.internal.pageSize.getHeight();
                const now = new Date().toLocaleString('en-ZW');
                const colW = (pageW - 40) / 2;
                const col1 = 15, col2 = col1 + colW + 10;

                // Header
                doc.setFillColor(34, 197, 94);
                doc.rect(0, 0, pageW, 18, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Starverse Express Courier — HANDOVER DOCUMENT', pageW / 2, 8, { align: 'center' });
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(`Printed: ${now}`, pageW / 2, 14, { align: 'center' });

                // Parcel info bar
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(`Tracking: ${parcel?.tracking_number ?? '—'}`, 15, 24);
                doc.text(`Transfer Type: ${TRANSFER_TYPES.find(t => t.v === transferType)?.label ?? '—'}`, pageW / 2, 24, { align: 'center' });
                doc.text(`Condition: ${CONDITION_OPTS.find(c => c.v === condition)?.label ?? '—'}`, pageW - 15, 24, { align: 'right' });
                doc.setDrawColor(200, 200, 200);
                doc.line(15, 27, pageW - 15, 27);

                // Two-column handover blocks
                const drawBlock = (x: number, colIdx: number) => {
                  const baseY = 33;
                  doc.setFillColor(248, 250, 252);
                  doc.roundedRect(x, baseY, colW, pageH - 43, 3, 3, 'F');
                  doc.setDrawColor(220, 220, 220);
                  doc.roundedRect(x, baseY, colW, pageH - 43, 3, 3, 'S');

                  let y = baseY + 8;
                  doc.setFontSize(9);
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(34, 197, 94);
                  doc.text(`HANDOVER ${colIdx + 1}`, x + colW / 2, y, { align: 'center' });
                  doc.setTextColor(0, 0, 0);

                  y += 7;
                  const fields = [
                    ['Handed By', colIdx === 0 ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() : ''],
                    ['To (Receiver)', colIdx === 0 ? (drivers as any[]).find((d: any) => d.id === toUserId)?.first_name || '—' : ''],
                    ['Time', colIdx === 0 ? now : ''],
                    ['From Location', colIdx === 0 ? fromLocation : ''],
                    ['To Location', colIdx === 0 ? (toLocation || '—') : ''],
                  ];

                  for (const [label, value] of fields) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7);
                    doc.text(label + ':', x + 5, y);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(value || '_________________________', colW - 12);
                    doc.text(lines, x + 5, y + 4);
                    y += 4 + lines.length * 4 + 2;
                  }

                  // Signature boxes
                  y += 3;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(7);
                  doc.text("Handover Signature:", x + 5, y);
                  y += 4;
                  if (fromSignature && colIdx === 0) {
                    try { doc.addImage(fromSignature, 'PNG', x + 5, y, 55, 18); } catch {}
                  }
                  doc.setDrawColor(100, 100, 100);
                  doc.rect(x + 5, y, 55, 18);
                  y += 22;

                  doc.setFont('helvetica', 'bold');
                  doc.text("Receiver Signature:", x + 5, y);
                  y += 4;
                  if (toSignature && colIdx === 0) {
                    try { doc.addImage(toSignature, 'PNG', x + 5, y, 55, 18); } catch {}
                  }
                  doc.rect(x + 5, y, 55, 18);
                };

                drawBlock(col1, 0);
                drawBlock(col2, 1);

                // Footer
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('Starverse Express Courier · Chain of Custody Document · Original stays with company, copy to receiver', pageW / 2, pageH - 5, { align: 'center' });

                doc.save(`handover-${parcel?.tracking_number ?? 'unknown'}-${Date.now()}.pdf`);
              }}
              className="w-full rounded-2xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700"
            >
              ↓ Download Handover PDF (A4)
            </button>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600">
                Next Parcel
              </button>
              <button onClick={() => navigate(`/parcels/${parcel?.id}/custody`)} className="flex-1 rounded-2xl border border-green-400 py-3 text-sm font-bold text-green-700 hover:bg-green-50">
                View Chain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
