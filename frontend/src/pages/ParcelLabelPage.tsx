import { useParams, useNavigate } from 'react-router-dom';
import { useGetParcel } from '../hooks/useQueries';

export function ParcelLabelPage() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  const { data: parcel, isLoading } = useGetParcel(parcelId!);

  const sender: any = parcel ? (Array.isArray(parcel.sender) ? parcel.sender[0] : parcel.sender) : null;
  const receiver: any = parcel ? (Array.isArray(parcel.receiver) ? parcel.receiver[0] : parcel.receiver) : null;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" /></div>;
  }

  if (!parcel) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Parcel not found</p>
        <button onClick={() => navigate('/parcels')} className="mt-3 text-sm text-brand-600 underline">Back to parcels</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Actions */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => navigate(-1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">← Back</button>
        <button onClick={() => window.print()} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">🖨️ Print Label</button>
      </div>

      {/* Label */}
      <div id="parcel-label" className="rounded-3xl border-2 border-slate-900 bg-white overflow-hidden print:border-2 print:rounded-none" style={{ fontFamily: 'monospace' }}>
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60">Mufasa Express Courier</p>
            <p className="text-lg font-black tracking-tight">mufasa.co.zw</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">Created</p>
            <p className="text-sm font-bold">{new Date(parcel.created_at).toLocaleDateString('en-ZW')}</p>
          </div>
        </div>

        {/* Tracking number — largest element */}
        <div className="border-b-2 border-slate-900 bg-brand-500 px-6 py-4 text-center">
          <p className="text-xs font-bold tracking-widest text-white opacity-80 uppercase mb-1">Tracking Number</p>
          <p className="text-3xl font-black text-white tracking-widest">{parcel.tracking_number}</p>
          {/* Simple barcode visual */}
          <div className="mt-3 flex justify-center gap-[1px]">
            {parcel.tracking_number.split('').map((char: string, i: number) => (
              <div
                key={i}
                className="bg-white"
                style={{ width: (char.charCodeAt(0) % 3 + 1) + 'px', height: '32px' }}
              />
            ))}
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 divide-x-2 divide-slate-900 border-b-2 border-slate-900">
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">FROM</p>
            {sender ? (
              <>
                <p className="text-base font-black text-slate-900">{sender.first_name} {sender.last_name}</p>
                <p className="text-sm text-slate-700 mt-0.5">{sender.phone}</p>
                {sender.landmark_address && <p className="text-xs text-slate-500 mt-1">{sender.landmark_address}</p>}
              </>
            ) : <p className="text-slate-400">—</p>}
          </div>
          <div className="px-5 py-4 bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">TO</p>
            {receiver ? (
              <>
                <p className="text-base font-black text-slate-900">{receiver.first_name} {receiver.last_name}</p>
                <p className="text-sm text-slate-700 mt-0.5">{receiver.phone}</p>
                {receiver.landmark_address && <p className="text-xs text-slate-500 mt-1 leading-tight">{receiver.landmark_address}</p>}
              </>
            ) : <p className="text-slate-400">—</p>}
          </div>
        </div>

        {/* Parcel details row */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 border-b-2 border-slate-900 text-center text-xs">
          {[
            ['Weight', parcel.weight ? `${parcel.weight} kg` : '—'],
            ['Status', parcel.status],
            ['Fragile', (parcel as any).fragile ? '⚠️ YES' : 'No'],
            ['Signature', (parcel as any).requires_signature ? '✍️ YES' : 'No'],
          ].map(([label, value]) => (
            <div key={label} className="py-3 px-2">
              <p className="font-black uppercase tracking-wider text-slate-400 text-[9px]">{label}</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50">
          <span>Scan QR or visit mufasa.co.zw/track to track this parcel</span>
          <span className="font-mono">{parcel.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #parcel-label, #parcel-label * { visibility: visible; }
          #parcel-label { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
