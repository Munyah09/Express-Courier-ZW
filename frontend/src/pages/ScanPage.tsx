import { useState, useRef, useCallback, useEffect } from 'react';
import { useParcelTrack, useRecordParcelEvent, useCreateCustomer } from '../hooks/useQueries';
import { useToast } from '../components/Toast';

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

// Decode QR from an ImageData using jsqr
async function decodeQRFromImage(img: HTMLImageElement | HTMLCanvasElement): Promise<string | null> {
  const jsQR = (await import('jsqr')).default;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (img instanceof HTMLImageElement) {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data ?? null;
}

export function ScanPage() {
  const notify = useToast();
  const [scanMode, setScanMode] = useState<'manual' | 'camera' | 'upload'>('manual');
  const [inputValue, setInputValue] = useState('');
  const [confirmedTracking, setConfirmedTracking] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: parcel, isLoading: parcelLoading } = useParcelTrack(confirmedTracking);
  const recordEvent = useRecordParcelEvent();

  const confirmTracking = (value?: string) => {
    const trimmed = (value ?? inputValue).trim().toUpperCase();
    if (trimmed) {
      setConfirmedTracking(trimmed);
      setInputValue(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmTracking();
  };

  // ── Camera QR scanning loop ────────────────────────────────────────────
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const jsQR = (await import('jsqr')).default;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        confirmTracking(code.data);
        notify(`QR decoded: ${code.data}`, 'success');
        return;
      }
    } catch {}

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [scanning]);

  useEffect(() => {
    if (scanning) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [scanning, scanFrame]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);
    } catch {
      notify('Camera access denied or not available. Use manual entry or file upload.', 'error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  // ── File upload QR decode ──────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('Decoding QR code…');

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise(resolve => { img.onload = resolve; });

      const result = await decodeQRFromImage(img);
      URL.revokeObjectURL(url);

      if (result) {
        confirmTracking(result);
        setUploadStatus(`Decoded: ${result}`);
        notify(`QR decoded: ${result}`, 'success');
      } else {
        setUploadStatus('No QR code found in image. Try a clearer photo.');
      }
    } catch {
      setUploadStatus('Failed to decode image.');
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEventLog = async (eventType: string) => {
    if (!parcel?.id) {
      notify('No parcel loaded. Scan a tracking number first.', 'error');
      return;
    }

    let gpsPoint: { lat: number; lng: number } | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
      );
      gpsPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    try {
      await recordEvent.mutateAsync({ parcelId: parcel.id, eventType, gpsPoint });
      setLog(prev => [
        { trackingNumber: confirmedTracking, eventType, timestamp: new Date().toLocaleTimeString(), success: true },
        ...prev
      ]);
      notify(`${eventType} recorded`, 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || String(err);
      setLog(prev => [
        { trackingNumber: confirmedTracking, eventType, timestamp: new Date().toLocaleTimeString(), success: false, error: errMsg },
        ...prev
      ]);
    }
  };

  const switchMode = (mode: typeof scanMode) => {
    stopCamera();
    setUploadStatus('');
    setScanMode(mode);
    if (mode === 'camera') startCamera();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Parcel Scan</h1>
        <p className="mt-1 text-sm text-slate-500">Scan QR code, upload an image, or enter tracking number manually</p>

        {/* Mode tabs */}
        <div className="mt-5 flex gap-2">
          {[
            { key: 'manual', label: '⌨️ Manual', },
            { key: 'camera', label: '📷 Camera QR', },
            { key: 'upload', label: '🖼️ Upload QR', },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key as typeof scanMode)}
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-sm transition-all ${scanMode === m.key ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Camera mode */}
        {scanMode === 'camera' && (
          <div className="mt-4 space-y-2">
            <div className="relative overflow-hidden rounded-2xl bg-slate-900">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl" />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-40 w-40 border-2 border-brand-400 rounded-xl opacity-70" />
              </div>
              {scanning && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-brand-500/90 px-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-semibold text-white">Scanning…</span>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-center text-xs text-slate-500">
              Point camera at QR code. Auto-detects when in frame.
            </p>
          </div>
        )}

        {/* Upload mode */}
        {scanMode === 'upload' && (
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 py-8 text-center hover:border-brand-500 hover:bg-brand-100 transition-all"
            >
              <div className="text-3xl mb-2">🖼️</div>
              <p className="text-sm font-semibold text-brand-700">Click to upload QR code image</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, screenshot — any image with a QR code</p>
            </button>
            {uploadStatus && (
              <p className={`mt-2 text-sm text-center ${uploadStatus.startsWith('Decoded') ? 'text-brand-600 font-semibold' : 'text-slate-500'}`}>
                {uploadStatus}
              </p>
            )}
          </div>
        )}

        {/* Tracking number input */}
        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tracking number (e.g. ME-1234567890-ABC)"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-mono focus:border-brand-500 focus:outline-none"
            autoFocus={scanMode === 'manual'}
          />
          <button
            onClick={() => confirmTracking()}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Load
          </button>
        </div>

        {parcelLoading && <p className="mt-3 text-sm text-slate-500">Loading parcel…</p>}

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
          <p className="text-xs text-slate-400 mt-0.5">GPS coordinates captured automatically if permitted.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EVENT_TYPES.map((evt) => (
              <button
                key={evt}
                onClick={() => handleEventLog(evt)}
                disabled={recordEvent.isPending}
                className="rounded-lg border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50 transition-colors"
              >
                {evt}
              </button>
            ))}
          </div>
          {recordEvent.isPending && <p className="mt-3 text-sm text-slate-500">Saving event…</p>}
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
