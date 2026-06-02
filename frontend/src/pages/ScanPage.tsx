import { useState, useRef, useCallback } from 'react';
import { useParcelTrack, useRecordParcelEvent } from '../hooks/useQueries';

const EVENT_TYPES = ['Accepted', 'Packed', 'Loaded', 'Dispatched', 'In Transit', 'Received', 'Out For Delivery', 'Delivered', 'Returned', 'Failed'];

const STATUS_COLORS: Record<string, string> = {
  Accepted: 'bg-blue-100 text-blue-700',
  Packed: 'bg-purple-100 text-purple-700',
  Loaded: 'bg-indigo-100 text-indigo-700',
  Dispatched: 'bg-cyan-100 text-cyan-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  Received: 'bg-teal-100 text-teal-700',
  'Out For Delivery': 'bg-yellow-100 text-yellow-700',
  Delivered: 'bg-green-100 text-green-700',
  Returned: 'bg-slate-100 text-slate-700',
  Failed: 'bg-red-100 text-red-700'
};

interface LogEntry {
  trackingNumber: string;
  eventType: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export function ScanPage() {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [inputValue, setInputValue] = useState('');
  const [confirmedTracking, setConfirmedTracking] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: parcel, isLoading: parcelLoading } = useParcelTrack(confirmedTracking);
  const recordEvent = useRecordParcelEvent();

  const confirmTracking = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) setConfirmedTracking(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmTracking();
  };

  const handleEventLog = async (eventType: string) => {
    if (!parcel?.id) {
      alert('No parcel loaded. Scan a tracking number first.');
      return;
    }

    let gpsPoint: { lat: number; lng: number } | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
      );
      gpsPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      // GPS optional — proceed without it
    }

    try {
      await recordEvent.mutateAsync({ parcelId: parcel.id, eventType, gpsPoint });
      setLog((prev) => [
        { trackingNumber: confirmedTracking, eventType, timestamp: new Date().toLocaleTimeString(), success: true },
        ...prev
      ]);
    } catch (err: any) {
      setLog((prev) => [
        {
          trackingNumber: confirmedTracking,
          eventType,
          timestamp: new Date().toLocaleTimeString(),
          success: false,
          error: err.response?.data?.error || String(err)
        },
        ...prev
      ]);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert('Camera access denied or not available.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Parcel Scan Workflow</h1>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => { setScanMode('manual'); stopCamera(); }}
            className={`flex-1 rounded-lg px-4 py-2 font-medium text-sm ${scanMode === 'manual' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => { setScanMode('camera'); startCamera(); }}
            className={`flex-1 rounded-lg px-4 py-2 font-medium text-sm ${scanMode === 'camera' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Camera
          </button>
        </div>

        {scanMode === 'camera' && (
          <div className="mt-4">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-slate-200 bg-slate-900" />
            <p className="mt-2 text-center text-xs text-slate-500">Point at QR/barcode, then type the number below</p>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter tracking number (e.g. ME-1234567890-ABC)"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoFocus={scanMode === 'manual'}
          />
          <button
            onClick={confirmTracking}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Load
          </button>
        </div>

        {parcelLoading && <p className="mt-3 text-sm text-slate-500">Loading parcel...</p>}

        {confirmedTracking && !parcelLoading && !parcel && (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Parcel not found: <strong>{confirmedTracking}</strong>
          </div>
        )}

        {parcel && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Tracking</p>
                <p className="font-mono text-sm font-semibold text-slate-900">{parcel.tracking_number}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[parcel.status] || 'bg-slate-100 text-slate-700'}`}>
                {parcel.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Sender</p>
                <p className="font-medium text-slate-900">{parcel.sender?.first_name} {parcel.sender?.last_name}</p>
                <p className="text-xs text-slate-500">{parcel.sender?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Receiver</p>
                <p className="font-medium text-slate-900">{parcel.receiver?.first_name} {parcel.receiver?.last_name}</p>
                <p className="text-xs text-slate-500">{parcel.receiver?.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {parcel && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Record Event</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EVENT_TYPES.map((evt) => (
              <button
                key={evt}
                onClick={() => handleEventLog(evt)}
                disabled={recordEvent.isPending}
                className="rounded-lg border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50"
              >
                {evt}
              </button>
            ))}
          </div>
          {recordEvent.isPending && <p className="mt-3 text-sm text-slate-500">Saving event...</p>}
        </div>
      )}

      {log.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Session Log</h2>
          <div className="mt-4 space-y-2">
            {log.map((entry, idx) => (
              <div key={idx} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${entry.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div>
                  <span className="font-medium text-slate-900">{entry.eventType}</span>
                  <span className="ml-2 text-xs text-slate-500">{entry.trackingNumber}</span>
                  {entry.error && <p className="text-xs text-red-600">{entry.error}</p>}
                </div>
                <span className="text-xs text-slate-400">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
