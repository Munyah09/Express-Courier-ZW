import { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  label?: string;
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  existingSignature?: string | null;
}

export function SignaturePad({ label = 'Sign here', onSave, onClear, existingSignature }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing]   = useState(false);
  const [isEmpty, setIsEmpty]   = useState(true);
  const [saved, setSaved]       = useState(!!existingSignature);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    setIsEmpty(false);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [drawing]);

  const stopDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setSaved(false);
    onClear?.();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setSaved(true);
  };

  if (saved && existingSignature) {
    return (
      <div className="space-y-2">
        {label && <p className="text-xs font-semibold text-slate-600">{label}</p>}
        <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-green-700">✅ Signed</span>
            <button onClick={clear} className="text-xs text-red-500 hover:underline">Clear & Re-sign</button>
          </div>
          <img src={existingSignature} alt="Signature" className="h-16 w-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-slate-600">{label}</p>}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={460}
          height={120}
          className="w-full touch-none rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-crosshair"
          style={{ height: '120px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400 select-none">
            ✍️ {label}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={isEmpty}
          className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isEmpty}
          className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
}
