import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api';

const STATUS_META: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  Accepted:           { label: 'Accepted',         icon: '📥', bg: 'bg-blue-50',   text: 'text-blue-700'   },
  Packed:             { label: 'Packed',            icon: '📦', bg: 'bg-purple-50', text: 'text-purple-700' },
  'In Transit':       { label: 'In Transit',        icon: '🚚', bg: 'bg-orange-50', text: 'text-orange-700' },
  'Out For Delivery': { label: 'Out For Delivery',  icon: '🛵', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  Delivered:          { label: 'Delivered',         icon: '✅', bg: 'bg-green-50',  text: 'text-green-700'  },
  Failed:             { label: 'Failed',            icon: '❌', bg: 'bg-red-50',    text: 'text-red-700'    },
  Returned:           { label: 'Returned',          icon: '↩️', bg: 'bg-slate-50',  text: 'text-slate-700'  },
};

export function LandingPage() {
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const tn = trackInput.trim().toUpperCase();
    if (!tn) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const { data } = await axios.get(`${API}/parcels/${tn}`);
      setTrackResult(data.data);
    } catch {
      setTrackError('Parcel not found. Check the tracking number and try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  const statusMeta = trackResult ? (STATUS_META[trackResult.status] ?? STATUS_META['Accepted']) : null;

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white font-black text-lg">S</div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-600 leading-none">Starverse Express</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">Courier Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="#track" className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors sm:block">
              📍 Track Parcel
            </a>
            <Link to="/login" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
              Sign In →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background with overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-800 to-slate-800"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-slate-900/90" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-36 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 border border-brand-400/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300 mb-6">
            🇿🇼 Built for Zimbabwe
          </span>
          <h1 className="font-poppins text-4xl font-semibold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            Zimbabwe's Courier,
            <br />
            <span className="text-brand-400 font-semibold">Your Way.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-300 leading-relaxed">
            No street address? No problem. Where DHL and FedEx stop at the city gate,
            <strong className="text-white"> Starverse Express goes all the way</strong> — guided by landmarks,
            local knowledge, and a community that knows every shortcut.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-7 py-4 text-sm font-bold text-white hover:bg-brand-400 transition-colors shadow-2xl shadow-brand-500/30"
            >
              📦 Ship a Parcel
            </Link>
            <a
              href="#track"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/25 bg-white/10 px-7 py-4 text-sm font-bold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              📍 Track Your Parcel
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-4">
            {[
              { label: 'Cities Covered', value: '22+' },
              { label: 'Named Routes',   value: '20+' },
              { label: 'OTP Verified',   value: '100%' },
              { label: 'Live Tracking',  value: 'Always' },
            ].map((s, i) => (
              <div key={s.label} className={`py-5 text-center ${i < 3 ? 'border-r border-white/10' : ''}`}>
                <p className="text-2xl font-black text-brand-400">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Track Parcel ────────────────────────────────────────────────────── */}
      <section id="track" className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Track Your Parcel</h2>
            <p className="mt-2 text-slate-500">Enter your tracking number for real-time status and event history</p>
          </div>

          <form onSubmit={handleTrack} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={trackInput}
              onChange={e => setTrackInput(e.target.value)}
              placeholder="e.g.  ME-1748919827410-ABCDE"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-mono placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 shadow-sm"
            />
            <button
              type="submit"
              disabled={trackLoading}
              className="shrink-0 rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {trackLoading ? '…' : 'Track →'}
            </button>
          </form>

          {trackError && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-center">
              <p className="text-sm font-medium text-red-700">🔍 {trackError}</p>
            </div>
          )}

          {trackResult && statusMeta && (
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className={`${statusMeta.bg} px-5 py-4 flex items-center justify-between`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracking Number</p>
                  <p className="font-mono text-lg font-black text-slate-900">{trackResult.tracking_number}</p>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusMeta.text} bg-white/60`}>
                  {statusMeta.icon} {trackResult.status}
                </span>
              </div>
              <div className="px-5 py-4 grid gap-3 sm:grid-cols-2">
                {[
                  ['Sender',   [trackResult.sender?.first_name, trackResult.sender?.last_name].filter(Boolean).join(' ')],
                  ['Receiver', [trackResult.receiver?.first_name, trackResult.receiver?.last_name].filter(Boolean).join(' ')],
                ].map(([label, name]) => (
                  <div key={label as string} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{(name as string) || '—'}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <Link to={`/tracking?q=${trackResult.tracking_number}`} className="text-sm font-semibold text-brand-600 hover:underline">
                  View full event history →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Why Starverse Express — 4 cards, 1 row ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Why Starverse Express?</h2>
          <p className="mt-2 text-slate-500">Courier built for how Zimbabwe actually works</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: '🏘️',
              title: 'Built For Zimbabwe',
              desc: "Near Mr Also shops, past the blue gate, red-roofed house by TM. Describe it the way you'd tell a local. We know every shortcut, every nickname.",
            },
            {
              icon: '📍',
              title: 'Real-Time Tracking',
              desc: 'Follow your parcel from pickup to door. Every scan, every handover, every stop — logged live so you always know where it is.',
            },
            {
              icon: '✅',
              title: 'OTP-Secured Handoffs',
              desc: 'A one-time PIN goes to the receiver. No forgery, no disputes. A verifiable chain of custody generated for every single shipment.',
            },
            {
              icon: '🚲',
              title: 'No Address? No Worries',
              desc: "FedEx and DHL need a street address. We don't. If you can describe it to a taxi driver, we can find it — wherever in Zimbabwe that may be.",
            },
          ].map(f => (
            <div
              key={f.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Ship in 3 Steps</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', icon: '👤', title: 'Add Sender & Receiver', desc: 'Search by phone or add a new customer in seconds. Saved for future shipments.' },
              { step: '2', icon: '📍', title: 'Describe the Location', desc: 'Use landmarks, areas, or any description a local driver would understand.' },
              { step: '3', icon: '🚚', title: 'Track & Deliver', desc: 'Real-time updates for every step until the OTP-confirmed delivery.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-2xl">
                  {s.icon}
                </div>
                <div className="mb-1 inline-block rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-black text-white">Step {s.step}</div>
                <h3 className="mt-2 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="bg-brand-500">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-poppins text-2xl font-semibold text-white sm:text-3xl">Ready to Ship?</h2>
          <p className="mt-3 text-brand-100 text-sm">Your first shipment takes under 2 minutes to create.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 hover:bg-brand-50 transition-colors shadow-lg">
              Sign In to Ship →
            </Link>
            <a href="#track" className="rounded-2xl border-2 border-white/40 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              📍 Track a Parcel
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-black text-sm">S</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 leading-none">Starverse Express</p>
                <p className="text-[10px] text-slate-400">Courier Platform · Zimbabwe 🇿🇼</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Starverse Express Courier. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
