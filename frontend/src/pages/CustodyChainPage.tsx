/**
 * CustodyChainPage — full chain of custody for a parcel.
 * Shows every handover with handler names, vehicles, locations,
 * timestamps and signature thumbnails.
 * Printable as a receipt-style document.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useGetParcel } from '../hooks/useQueries';

const TRANSFER_ICONS: Record<string, string> = {
  intake:           '📥',
  branch_to_driver: '🚚',
  driver_to_driver: '🔄',
  driver_to_branch: '🏢',
  branch_to_branch: '🔁',
  last_mile:        '🛵',
  failed_return:    '↩️',
  customer_pickup:  '🙋',
};

const CONDITION_BADGES: Record<string, string> = {
  good:               'bg-green-100 text-green-700',
  damaged:            'bg-red-100 text-red-700',
  suspected_damaged:  'bg-orange-100 text-orange-700',
  missing_contents:   'bg-red-200 text-red-800',
};

function useCustodyChain(parcelId: string) {
  return useQuery({
    queryKey: ['custody', parcelId],
    queryFn: async () => { const { data } = await api.get(`/custody/${parcelId}`); return data.data ?? []; },
    enabled: !!parcelId,
  });
}

export function CustodyChainPage() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  const { data: parcel } = useGetParcel(parcelId!);
  const { data: chain = [], isLoading } = useCustodyChain(parcelId!);

  const sender: any = parcel ? (Array.isArray(parcel.sender) ? parcel.sender[0] : parcel.sender) : null;
  const receiver: any = parcel ? (Array.isArray(parcel.receiver) ? parcel.receiver[0] : parcel.receiver) : null;

  const printDoc = () => window.print();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Actions */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => navigate(`/parcels/${parcelId}`)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          ← Back to Parcel
        </button>
        <div className="flex gap-2">
          <button onClick={printDoc} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            🖨️ Print Document
          </button>
        </div>
      </div>

      {/* Document header */}
      <div id="custody-doc" className="rounded-3xl border border-slate-900 bg-white overflow-hidden print:rounded-none print:border-2">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Mufasa Express Courier</p>
              <h1 className="mt-1 text-xl font-black">Chain of Custody Document</h1>
              <p className="mt-0.5 text-sm opacity-70">Official record of all parcel transfers</p>
            </div>
            <div className="text-right text-xs opacity-60">
              <p>Printed: {new Date().toLocaleString('en-ZW')}</p>
            </div>
          </div>
        </div>

        {/* Parcel summary */}
        {parcel && (
          <div className="border-b border-slate-200 px-6 py-4 bg-orange-50">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Tracking No.</p>
                <p className="font-mono font-black text-slate-900">{parcel.tracking_number}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Status</p>
                <p className="font-bold text-slate-900">{parcel.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Sender</p>
                <p className="font-medium text-slate-900">{sender?.first_name} {sender?.last_name}</p>
                <p className="text-xs text-slate-500">{sender?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Receiver</p>
                <p className="font-medium text-slate-900">{receiver?.first_name} {receiver?.last_name}</p>
                <p className="text-xs text-slate-500">{receiver?.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chain */}
        <div className="divide-y divide-slate-100">
          {isLoading && (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
            </div>
          )}

          {!isLoading && chain.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-3xl mb-2">📋</p>
              <p>No custody transfers recorded yet</p>
            </div>
          )}

          {chain.map((transfer: any, idx: number) => {
            const fromUser: any = Array.isArray(transfer.from_user) ? transfer.from_user[0] : transfer.from_user;
            const toUser: any   = Array.isArray(transfer.to_user)   ? transfer.to_user[0]   : transfer.to_user;
            const fromVeh: any  = Array.isArray(transfer.from_vehicle) ? transfer.from_vehicle[0] : transfer.from_vehicle;
            const toVeh: any    = Array.isArray(transfer.to_vehicle)   ? transfer.to_vehicle[0]   : transfer.to_vehicle;
            const acknowledged = !!transfer.acknowledged_at;

            return (
              <div key={transfer.id} className="px-6 py-5">
                {/* Transfer header */}
                <div className="flex items-start gap-4">
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-black">
                      {idx + 1}
                    </div>
                    {idx < chain.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" style={{ minHeight: 24 }} />}
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Transfer type + time */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{TRANSFER_ICONS[transfer.transfer_type] ?? '📦'}</span>
                        <div>
                          <p className="font-bold text-slate-900 capitalize">{transfer.transfer_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">{new Date(transfer.transferred_at).toLocaleString('en-ZW')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${CONDITION_BADGES[transfer.parcel_condition] ?? 'bg-slate-100 text-slate-600'}`}>
                          {transfer.parcel_condition?.replace(/_/g, ' ')}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${acknowledged ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {acknowledged ? '✓ Acknowledged' : '⏳ Pending receipt'}
                        </span>
                      </div>
                    </div>

                    {/* From / To */}
                    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Handed Over By</p>
                        {fromUser ? (
                          <p className="font-semibold text-slate-900">{fromUser.first_name} {fromUser.last_name}</p>
                        ) : <p className="text-slate-400 italic">—</p>}
                        <p className="text-xs text-slate-600 mt-0.5">📍 {transfer.from_location}</p>
                        {fromVeh && <p className="text-xs text-slate-500">🚗 {fromVeh.registration} ({fromVeh.type})</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Received By</p>
                        {toUser ? (
                          <p className="font-semibold text-slate-900">{toUser.first_name} {toUser.last_name}</p>
                        ) : <p className="text-slate-400 italic">Pending</p>}
                        {transfer.to_location && <p className="text-xs text-slate-600 mt-0.5">📍 {transfer.to_location}</p>}
                        {toVeh && <p className="text-xs text-slate-500">🚗 {toVeh.registration} ({toVeh.type})</p>}
                      </div>
                    </div>

                    {transfer.notes && (
                      <p className="text-xs text-slate-500 italic">Note: {transfer.notes}</p>
                    )}

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Handover Signature</p>
                        {transfer.from_signature ? (
                          <img src={transfer.from_signature} alt="Handover sig" className="h-14 w-full object-contain bg-white rounded" />
                        ) : (
                          <div className="h-14 rounded bg-slate-50 flex items-center justify-center text-xs text-slate-400">Not signed</div>
                        )}
                        {fromUser && <p className="mt-1 text-[10px] text-center text-slate-500">{fromUser.first_name} {fromUser.last_name}</p>}
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Receiver Signature</p>
                        {transfer.to_signature ? (
                          <img src={transfer.to_signature} alt="Receiver sig" className="h-14 w-full object-contain bg-white rounded" />
                        ) : (
                          <div className="h-14 rounded bg-amber-50 flex items-center justify-center text-xs text-amber-500">Pending signature</div>
                        )}
                        {toUser && <p className="mt-1 text-[10px] text-center text-slate-500">{toUser.first_name} {toUser.last_name}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs text-slate-400">
          <div className="flex justify-between flex-wrap gap-2">
            <span>Mufasa Express Courier · mufasa.co.zw · Zimbabwe 🇿🇼</span>
            <span>Document ID: {parcel?.id?.slice(0, 8).toUpperCase()} · {chain.length} transfer(s)</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #custody-doc, #custody-doc * { visibility: visible; }
          #custody-doc { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
