import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const ZW_CITIES = ['Harare','Bulawayo','Mutare','Gweru','Kwekwe','Kadoma','Masvingo','Chinhoyi','Bindura','Marondera','Chegutu','Zvishavane','Redcliff','Beitbridge','Kariba','Victoria Falls','Hwange','Plumtree','Rusape','Chipinge','Chiredzi'];

function usePriceCalc(params: Record<string, string>) {
  return useQuery({
    queryKey: ['pricing', params],
    queryFn: async () => { const { data } = await api.get('/pricing/calculate', { params }); return data.data; },
    enabled: !!params.origin && !!params.destination && !!params.weight,
  });
}

const SEL = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';
const INP = `${SEL}`;

export function PricingPage() {
  const [origin, setOrigin] = useState('Harare');
  const [destination, setDestination] = useState('Bulawayo');
  const [weight, setWeight] = useState('1');
  const [deliveryType, setDeliveryType] = useState('home');
  const [insurance, setInsurance] = useState('0');
  const [fragile, setFragile] = useState(false);
  const [debounced, setDebounced] = useState({ origin, destination, weight, deliveryType, insurance, fragile: fragile.toString() });

  useEffect(() => {
    const t = setTimeout(() => setDebounced({ origin, destination, weight, deliveryType, insurance, fragile: fragile.toString() }), 400);
    return () => clearTimeout(t);
  }, [origin, destination, weight, deliveryType, insurance, fragile]);

  const { data: result, isLoading } = usePriceCalc(debounced);
  const bd = result?.breakdown;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing Calculator</h1>
        <p className="text-sm text-slate-500 mt-0.5">Get an instant quote for any shipment</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Shipment Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">From (Origin)</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} className={SEL}>
                {ZW_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">To (Destination)</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} className={SEL}>
                {ZW_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Weight (kg)</label>
            <input type="number" step="0.1" min="0.1" value={weight} onChange={e => setWeight(e.target.value)} className={INP} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Delivery Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'home', label: 'Home', icon: '🏠' },
                { v: 'collection_point', label: 'Collection', icon: '📍' },
                { v: 'intercity', label: 'Intercity', icon: '🚚' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => setDeliveryType(opt.v)}
                  className={`rounded-xl border-2 p-3 text-center text-xs font-semibold transition-all ${deliveryType === opt.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  <div className="text-xl mb-1">{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Declared Value (USD) — for insurance</label>
            <input type="number" step="1" min="0" value={insurance} onChange={e => setInsurance(e.target.value)} placeholder="0" className={INP} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={fragile} onChange={e => setFragile(e.target.checked)} className="h-4 w-4 rounded accent-brand-500" />
            <span className="text-sm font-medium text-slate-700">⚠️ Fragile cargo (+15%)</span>
          </label>
        </div>

        {/* Quote */}
        <div className="rounded-3xl border-2 border-brand-400 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm flex flex-col">
          <h2 className="font-semibold text-slate-900 mb-4">Your Quote</h2>

          <div className="flex-1">
            <div className="mb-6 text-center py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{origin} → {destination}</p>
              {isLoading ? (
                <div className="h-14 w-32 mx-auto animate-pulse rounded-2xl bg-slate-100" />
              ) : (
                <p className="text-6xl font-black text-brand-600 tracking-tight">
                  ${bd?.total ?? '—'}
                </p>
              )}
              <p className="text-sm text-slate-400 mt-1">{weight} kg · {deliveryType.replace('_', ' ')}</p>
            </div>

            {bd && (
              <div className="space-y-2 rounded-2xl bg-white border border-slate-100 p-4">
                {[
                  ['Base Rate', `$${bd.baseRate}`],
                  ['Weight Multiplier', `×${bd.weightMultiplier}`],
                  ['Subtotal', `$${bd.subtotal}`],
                  bd.fragileSurcharge > 0 && ['Fragile Surcharge', `$${bd.fragileSurcharge}`],
                  bd.insuranceFee > 0 && ['Insurance (2%)', `$${bd.insuranceFee}`],
                ].filter(Boolean).map(([label, value]: any) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-brand-700">${bd.total} USD</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <a href="/create" className="block w-full rounded-2xl bg-brand-500 py-3 text-center text-sm font-bold text-white hover:bg-brand-600 transition-colors">
              📦 Ship Now at This Price
            </a>
            <p className="text-center text-xs text-slate-400">Prices in USD · Subject to zone confirmation</p>
          </div>
        </div>
      </div>

      {/* Rate card reference */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Rate Reference</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Local (same city)', from: '$2.00', desc: 'Up to 1 kg base rate', icon: '🏙️' },
            { label: 'Intercity', from: '$7.00', desc: 'Major cities, up to 1 kg', icon: '🚚' },
            { label: 'Home Delivery', from: '+$1.50', desc: 'Added to all home deliveries', icon: '🏠' },
          ].map(r => (
            <div key={r.label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl mb-2">{r.icon}</p>
              <p className="font-semibold text-slate-900">{r.label}</p>
              <p className="text-xl font-bold text-brand-600">{r.from}</p>
              <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs text-slate-600">
          {[['0–1 kg','×1.0'],['1–5 kg','×1.4'],['5–10 kg','×1.8'],['10–25 kg','×2.5'],['25–50 kg','×3.5'],['50+ kg','×5.0']].map(([range, mult]) => (
            <div key={range} className="flex justify-between rounded-lg bg-slate-100 px-3 py-2">
              <span>{range}</span><span className="font-bold text-slate-800">{mult}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
