import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useParcelTrack } from '../hooks/useQueries';

const STATUS_STEPS = ['Accepted', 'Packed', 'In Transit', 'Out For Delivery', 'Delivered'];

const STATUS_META: Record<string, { color: string; bg: string; icon: string }> = {
  Accepted:          { color: 'text-blue-700',   bg: 'bg-blue-500',   icon: '📥' },
  Packed:            { color: 'text-purple-700',  bg: 'bg-purple-500', icon: '📦' },
  'In Transit':      { color: 'text-orange-700',  bg: 'bg-orange-500', icon: '🚚' },
  'Out For Delivery':{ color: 'text-yellow-700',  bg: 'bg-yellow-500', icon: '🛵' },
  Delivered:         { color: 'text-green-700',   bg: 'bg-green-500',  icon: '✅' },
  Failed:            { color: 'text-red-700',     bg: 'bg-red-500',    icon: '❌' },
  Returned:          { color: 'text-slate-700',   bg: 'bg-slate-400',  icon: '↩️' },
};

function ProgressBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status);
  const isFailed = status === 'Failed' || status === 'Returned';
  if (isFailed) return (
    <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-center">
      <p className="text-sm font-semibold text-red-600">
        {STATUS_META[status]?.icon} Parcel {status} — contact support for assistance
      </p>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        {STATUS_STEPS.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          const meta = STATUS_META[step];
          return (
            <div key={step} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? `${meta.bg} text-white shadow-lg scale-110` : 'bg-slate-100 text-slate-400'}`}>
                {done ? '✓' : meta.icon}
              </div>
              <span className={`hidden text-center text-[10px] font-semibold sm:block ${active ? meta.color : done ? 'text-green-600' : 'text-slate-400'}`}>
                {step}
              </span>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`absolute hidden`} />
              )}
            </div>
          );
        })}
      </div>
      {/* Connector line */}
      <div className="relative h-1.5 rounded-full bg-slate-100 mx-4">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 transition-all duration-700"
          style={{ width: idx < 0 ? '0%' : `${(idx / (STATUS_STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

async function decodeQRFile(file: File): Promise<string | null> {
  const jsQR = (await import('jsqr')).default;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await new Promise(resolve => { img.onload = resolve; });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data ?? null;
}

export function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [activeTracking, setActiveTracking] = useState(searchParams.get('q') ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrStatus, setQrStatus] = useState('');

  // When ?q= changes externally (e.g. from landing page link), sync state
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q && q !== activeTracking) {
      setInputValue(q);
      setActiveTracking(q);
    }
  }, [searchParams]);

  const { data: parcel, isLoading, isError } = useParcelTrack(activeTracking);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) return;
    setActiveTracking(trimmed);
    setSearchParams({ q: trimmed }, { replace: true });
  };

  const sender: any = parcel ? (Array.isArray(parcel.sender) ? parcel.sender[0] : parcel.sender) : null;
  const receiver: any = parcel ? (Array.isArray(parcel.receiver) ? parcel.receiver[0] : parcel.receiver) : null;
  const events: any[] = parcel?.events ?? [];
  const meta = parcel ? (STATUS_META[parcel.status] ?? STATUS_META['Accepted']) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Search */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Track Your Parcel</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your tracking number to get real-time status updates</p>
        <form onSubmit={handleSearch} className="mt-5 flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. ME-1748919827410-ABCDE"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button type="submit" className="rounded-2xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
            Track →
          </button>
        </form>

        {/* QR code upload */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setQrStatus('Decoding QR…');
            const result = await decodeQRFile(file);
            if (result) {
              setInputValue(result.trim().toUpperCase());
              setActiveTracking(result.trim().toUpperCase());
              setSearchParams({ q: result.trim().toUpperCase() }, { replace: true });
              setQrStatus('');
            } else {
              setQrStatus('No QR code found in image.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 w-full rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-all"
        >
          🖼️ Upload QR Code Image to Track
        </button>
        {qrStatus && <p className="mt-1 text-xs text-center text-slate-500">{qrStatus}</p>}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />)}
        </div>
      )}

      {/* Not found */}
      {!isLoading && isError && activeTracking && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-red-700">Parcel not found</p>
          <p className="mt-1 text-sm text-slate-500">Check your tracking number and try again, or contact support.</p>
        </div>
      )}

      {/* Parcel found */}
      {parcel && !isLoading && (
        <div className="space-y-4">
          {/* Status card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tracking Number</p>
                <p className="mt-0.5 font-mono text-xl font-bold text-slate-900">{parcel.tracking_number}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${meta?.color} bg-opacity-10`}
                style={{ background: 'var(--status-bg, #f1f5f9)' }}>
                {meta?.icon} {parcel.status}
              </span>
            </div>

            <ProgressBar status={parcel.status} />
          </div>

          {/* Parties */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sender</p>
              {sender ? (
                <>
                  <p className="font-semibold text-slate-900">{sender.first_name} {sender.last_name}</p>
                  <p className="text-sm text-slate-500">{sender.phone}</p>
                  {sender.landmark_address && <p className="mt-1 text-xs text-slate-400">{sender.landmark_address}</p>}
                </>
              ) : <p className="text-sm text-slate-400">—</p>}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Receiver</p>
              {receiver ? (
                <>
                  <p className="font-semibold text-slate-900">{receiver.first_name} {receiver.last_name}</p>
                  <p className="text-sm text-slate-500">{receiver.phone}</p>
                  {receiver.landmark_address && <p className="mt-1 text-xs text-slate-400">{receiver.landmark_address}</p>}
                </>
              ) : <p className="text-sm text-slate-400">—</p>}
            </div>
          </div>

          {/* Parcel info */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Parcel Info</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ['Weight', parcel.weight ? `${parcel.weight} kg` : null],
                ['Dimensions', parcel.dimensions],
                ['Declared Value', parcel.declared_value ? `$${parcel.declared_value}` : null],
                ['Insurance', parcel.insurance_amount ? `$${parcel.insurance_amount}` : null],
                ['Notes', parcel.notes],
              ].map(([label, value]) => value ? (
                <div key={label as string}>
                  <span className="text-slate-400">{label}: </span>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Timeline */}
          {events.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-5">Event History</h2>
              <ol className="relative ml-3 border-l border-slate-200">
                {[...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((evt, i) => (
                  <li key={evt.id ?? i} className="mb-5 ml-5">
                    <div className="absolute -left-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500 mt-1" />
                    <p className="text-sm font-bold text-slate-900">{evt.event_type}</p>
                    {evt.event_description && <p className="text-sm text-slate-600">{evt.event_description}</p>}
                    <time className="text-xs text-slate-400">{new Date(evt.created_at).toLocaleString('en-ZW')}</time>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Empty state (no search yet) */}
      {!activeTracking && !isLoading && (
        <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">📍</p>
          <p className="font-medium">Enter a tracking number above to get started</p>
        </div>
      )}
    </div>
  );
}
