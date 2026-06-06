import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetParcel, useUpdateParcelStatus } from '../hooks/useQueries';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

const STATUSES = ['Accepted', 'Packed', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed', 'Returned'];

const STATUS_COLORS: Record<string, string> = {
  Accepted: 'bg-blue-100 text-blue-700',
  Packed: 'bg-purple-100 text-purple-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Out For Delivery': 'bg-yellow-100 text-yellow-700',
  Delivered: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Returned: 'bg-slate-100 text-slate-600'
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs font-medium text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 text-right break-words min-w-0">{value ?? '—'}</span>
    </div>
  );
}

function Timeline({ events }: { events: any[] }) {
  if (!events?.length) return <p className="text-sm text-slate-400 py-4">No events recorded</p>;

  return (
    <ol className="relative ml-3 border-l border-slate-200">
      {[...events].reverse().map((evt, i) => (
        <li key={evt.id ?? i} className="mb-6 ml-5">
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-brand-500" />
          <p className="text-xs font-semibold text-brand-700">{evt.event_type}</p>
          <time className="mb-1 text-xs text-slate-400">
            {new Date(evt.created_at).toLocaleString('en-ZW')}
          </time>
          {evt.event_description && (
            <p className="text-sm text-slate-700">{evt.event_description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ParcelDetailPage() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  const notify = useToast();

  const { data: parcel, isLoading, error, refetch } = useGetParcel(parcelId!);
  const updateStatus = useUpdateParcelStatus();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const handleGenerateOtp = async () => {
    if (!parcelId) return;
    setOtpLoading(true);
    try {
      const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error } = await supabase.from('parcel_otps').insert({ parcel_id: parcelId, otp_code, expires_at });
      if (error) throw error;
      setGeneratedOtp(otp_code);
      notify('OTP generated — share this code with the driver', 'success');
    } catch { notify('Failed to generate OTP', 'error'); }
    finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!parcelId || !otpInput) return;
    setOtpVerifying(true);
    try {
      const { data, error } = await supabase
        .from('parcel_otps')
        .select('*')
        .eq('parcel_id', parcelId)
        .eq('otp_code', otpInput)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      if (!data) { notify('Invalid or expired OTP', 'error'); return; }
      await supabase.from('parcels').update({ status: 'Delivered' }).eq('id', parcelId);
      await supabase.from('parcel_events').insert({
        parcel_id: parcelId,
        event_type: 'delivered',
        event_description: 'Delivery confirmed via OTP verification',
      });
      notify('Delivery confirmed! Parcel marked as Delivered', 'success');
      setOtpInput('');
      setGeneratedOtp(null);
      refetch();
    } catch { notify('Invalid or expired OTP', 'error'); }
    finally { setOtpVerifying(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !parcelId) return;
    try {
      await updateStatus.mutateAsync({ parcelId, status: newStatus, notes: statusNotes });
      notify(`Status updated to ${newStatus}`, 'success');
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
      refetch();
    } catch {
      notify('Failed to update status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />)}
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-700">Parcel not found</p>
        <button onClick={() => navigate('/parcels')} className="mt-3 text-sm text-red-500 underline">
          Back to Parcels
        </button>
      </div>
    );
  }

  const sender: any = Array.isArray(parcel.sender) ? parcel.sender[0] : parcel.sender;
  const receiver: any = Array.isArray(parcel.receiver) ? parcel.receiver[0] : parcel.receiver;
  const events: any[] = parcel.events ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/parcels')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← Back
          </button>
          <div>
            <h1 className="font-mono text-xl font-semibold text-slate-900">{parcel.tracking_number}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[parcel.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {parcel.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/tracking?q=${parcel.tracking_number}`}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Public View
          </Link>
          <Link
            to={`/parcels/${parcelId}/label`}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🖨️ Label
          </Link>
          <button
            onClick={() => { setNewStatus(parcel.status); setShowStatusModal(true); }}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Update Status
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Parcel Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Parcel Details</h2>
            <InfoRow label="Tracking #" value={parcel.tracking_number} />
            <InfoRow label="Status" value={parcel.status} />
            <InfoRow label="Weight" value={parcel.weight ? `${parcel.weight} kg` : null} />
            <InfoRow label="Dimensions" value={parcel.dimensions} />
            <InfoRow label="Declared Value" value={parcel.declared_value ? `$${parcel.declared_value}` : null} />
            <InfoRow label="Insurance" value={parcel.insurance_amount ? `$${parcel.insurance_amount}` : null} />
            <InfoRow label="Notes" value={parcel.notes} />
            <InfoRow label="Created" value={new Date(parcel.created_at).toLocaleString('en-ZW')} />
            <InfoRow label="Last Updated" value={new Date(parcel.updated_at).toLocaleString('en-ZW')} />
          </div>

          {/* Parties */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3">Sender</h2>
              {sender ? (
                <>
                  <p className="font-medium text-slate-900">{sender.first_name} {sender.last_name}</p>
                  <p className="text-sm text-slate-500">{sender.phone}</p>
                  {sender.landmark_address && <p className="mt-1 text-sm text-slate-500">{sender.landmark_address}</p>}
                </>
              ) : <p className="text-sm text-slate-400">No sender info</p>}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3">Receiver</h2>
              {receiver ? (
                <>
                  <p className="font-medium text-slate-900">{receiver.first_name} {receiver.last_name}</p>
                  <p className="text-sm text-slate-500">{receiver.phone}</p>
                  {receiver.landmark_address && <p className="mt-1 text-sm text-slate-500">{receiver.landmark_address}</p>}
                </>
              ) : <p className="text-sm text-slate-400">No receiver info</p>}
            </div>
          </div>
        </div>

        {/* OTP Delivery Verification */}
        {(parcel.status === 'Out For Delivery' || parcel.status === 'In Transit') && (
          <div className="rounded-3xl border-2 border-brand-400 bg-brand-50 p-5 shadow-sm lg:col-span-3">
            <h2 className="font-semibold text-slate-900 mb-1">OTP Delivery Verification</h2>
            <p className="text-sm text-slate-500 mb-4">Generate an OTP to send to the receiver, then verify on handoff to confirm delivery.</p>
            <div className="grid gap-3 sm:grid-cols-2 max-w-lg">
              <div className="space-y-2">
                <button onClick={handleGenerateOtp} disabled={otpLoading} className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
                  {otpLoading ? 'Generating…' : '📲 Generate & Send OTP'}
                </button>
                {generatedOtp && (
                  <div className="rounded-xl bg-white border border-brand-200 p-3 text-center">
                    <p className="text-xs text-slate-500">OTP Code (share with driver)</p>
                    <p className="text-3xl font-black tracking-widest text-brand-600">{generatedOtp}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xl font-bold tracking-widest focus:border-brand-400 focus:outline-none"
                />
                <button onClick={handleVerifyOtp} disabled={otpVerifying || otpInput.length !== 6} className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60">
                  {otpVerifying ? 'Verifying…' : '✅ Confirm Delivery'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">Event History</h2>
          <Timeline events={events} />
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="font-semibold text-slate-900 mb-4">Update Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  placeholder="Add a note…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updateStatus.isPending}
                  className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {updateStatus.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
