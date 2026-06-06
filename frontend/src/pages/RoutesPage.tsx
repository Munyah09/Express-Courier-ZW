import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

const SEED_ROUTES = [
  { name: 'Harare → Zvishavane (Via Gweru)', origin: 'Harare', destination: 'Zvishavane', notes: 'Stops: Whitehouse/Granary · Norton · Chegutu · Kadoma · Kwekwe · Gweru · Shurugwi · Siboza · Zvishavane · Mberengwa (terminus)' },
  { name: 'Harare → Zvishavane (Via Masvingo)', origin: 'Harare', destination: 'Zvishavane', notes: 'Stops: Beatrice · Furtherstone · Chivhu · Mvuma · Chaka · Masvingo · Mashava · Mhandamabwe · Zvishavane' },
  { name: 'Harare → Bulawayo', origin: 'Harare', destination: 'Bulawayo', notes: 'Stops: Norton · Chegutu · Kadoma · Kwekwe · Gweru · Ngezi · Shangani · Halfway House · Bulawayo' },
  { name: 'Harare → Beitbridge', origin: 'Harare', destination: 'Beitbridge', notes: 'Stops: Beatrice · Chivhu · Mvuma · Masvingo · Ngundu · Bubi · Rutenga · Beitbridge' },
  { name: 'Harare → Mutare', origin: 'Harare', destination: 'Mutare', notes: 'Stops: Marondera · Rusape · Mutare' },
  { name: 'Harare → Kariba', origin: 'Harare', destination: 'Kariba', notes: 'Stops: Chinhoyi · Karoi · Makuti · Siakobvu · Kariba' },
  { name: 'Harare → Chirundu', origin: 'Harare', destination: 'Chirundu', notes: 'Stops: Chinhoyi · Karoi · Makuti · Chirundu (Zimbabwe–Zambia border)' },
  { name: 'Harare → Hwange', origin: 'Harare', destination: 'Hwange', notes: 'Stops: Kadoma · Kwekwe · Gweru · Bulawayo · Hwange National Park Gate' },
  { name: 'Harare → Nyanga', origin: 'Harare', destination: 'Nyanga', notes: 'Stops: Marondera · Rusape · Nyanga · Troutbeck Junction' },
  { name: 'Harare → Chiredzi', origin: 'Harare', destination: 'Chiredzi', notes: 'Stops: Masvingo · Ngundu · Triangle · Chiredzi' },
  { name: 'Harare → Chimanimani', origin: 'Harare', destination: 'Chimanimani', notes: 'Stops: Marondera · Rusape · Mutare · Wengezi · Skyline Junction · Chimanimani' },
  { name: 'Harare → Bindura', origin: 'Harare', destination: 'Bindura', notes: 'Stops: Mazowe · Bindura' },
  { name: 'Harare → Victoria Falls', origin: 'Harare', destination: 'Victoria Falls', notes: 'Stops: Kadoma · Kwekwe · Gweru · Bulawayo · Hwange · Victoria Falls' },
  { name: 'Harare → Masvingo', origin: 'Harare', destination: 'Masvingo', notes: 'Stops: Beatrice · Chivhu · Mvuma · Masvingo (Great Zimbabwe Road)' },
  { name: 'Harare → Gweru', origin: 'Harare', destination: 'Gweru', notes: 'Stops: Norton · Chegutu · Kadoma · Kwekwe · Gweru' },
  { name: 'Harare → Kwekwe', origin: 'Harare', destination: 'Kwekwe', notes: 'Stops: Norton · Chegutu · Kadoma · Kwekwe (Gold City)' },
  { name: 'Harare → Kadoma', origin: 'Harare', destination: 'Kadoma', notes: 'Stops: Norton · Chegutu · Kadoma' },
  { name: 'Harare → Chinhoyi', origin: 'Harare', destination: 'Chinhoyi', notes: 'Stops: Norton · Chinhoyi (Caves Road)' },
  { name: 'Harare → Marondera', origin: 'Harare', destination: 'Marondera', notes: 'Stops: Ruwa · Marondera' },
  { name: 'Bulawayo → Beitbridge', origin: 'Bulawayo', destination: 'Beitbridge', notes: 'Stops: Gwanda · West Nicholson · Beitbridge' },
  { name: 'Bulawayo → Victoria Falls', origin: 'Bulawayo', destination: 'Victoria Falls', notes: 'Stops: Hwange · Deka · Victoria Falls' },
  { name: 'Mutare → Chipinge', origin: 'Mutare', destination: 'Chipinge', notes: 'Stops: Wengezi · Skyline Junction · Chipinge' },
  { name: 'Mutare → Chiredzi', origin: 'Mutare', destination: 'Chiredzi', notes: 'Stops: Wengezi · Chipinge · Hippo Valley · Chiredzi' },
  { name: 'Masvingo → Beitbridge', origin: 'Masvingo', destination: 'Beitbridge', notes: 'Stops: Ngundu · Bubi · Rutenga · Beitbridge' },
  { name: 'Harare → Mbire', origin: 'Harare', destination: 'Mbire', notes: 'Stops: Bindura · Muzarabani · Kairezi · Mbire (remote rural)' },
];

function useSeedRoutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const rows = SEED_ROUTES.map(r => ({ ...r, status: 'active' }));
      const { error } = await supabase.from('routes').upsert(rows, { onConflict: 'name' });
      if (error) throw error;
      return { created: rows.length, skipped: 0 };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: any) => {
      const { data, error } = await supabase.from('routes').insert({ ...p, status: 'active' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}
function usePatchRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: any) => {
      const { data, error } = await supabase.from('routes').update(p).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

const ZW_CITIES = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Bindura', 'Marondera', 'Chegutu', 'Zvishavane', 'Redcliff', 'Beitbridge', 'Kariba', 'Victoria Falls', 'Hwange', 'Plumtree', 'Rusape', 'Chipinge', 'Chiredzi'];

export function RoutesPage() {
  const notify = useToast();
  const { data: routes = [], isLoading } = useRoutes();
  const createRoute = useCreateRoute();
  const patchRoute = usePatchRoute();
  const seedRoutes = useSeedRoutes();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', origin: 'Harare', destination: 'Bulawayo', notes: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.origin || !form.destination) { notify('Origin and destination required', 'error'); return; }
    const name = form.name || `${form.origin} → ${form.destination}`;
    try {
      await createRoute.mutateAsync({ ...form, name });
      notify('Route created', 'success');
      setShowAdd(false);
      setForm({ name: '', origin: 'Harare', destination: 'Bulawayo', notes: '' });
    } catch { notify('Failed to create route', 'error'); }
  };

  const toggleStatus = async (id: string, status: string) => {
    await patchRoute.mutateAsync({ id, status: status === 'active' ? 'suspended' : 'active' });
  };

  const activeRoutes = routes.filter((r: any) => r.status === 'active');
  const suspendedRoutes = routes.filter((r: any) => r.status !== 'active');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Routes</h1>
          <p className="text-sm text-slate-500">{activeRoutes.length} active · {suspendedRoutes.length} suspended</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const res = await seedRoutes.mutateAsync();
                notify(`${res.created} Zimbabwe routes loaded (${res.skipped} already existed)`, 'success');
              } catch { notify('Failed to load routes', 'error'); }
            }}
            disabled={seedRoutes.isPending}
            className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
          >
            {seedRoutes.isPending ? 'Loading…' : '🗺️ Load Zimbabwe Routes'}
          </button>
          <button onClick={() => setShowAdd(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">+ Add Route</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Routes', value: routes.length, color: 'bg-blue-50 text-blue-900' },
          { label: 'Active', value: activeRoutes.length, color: 'bg-green-50 text-green-900' },
          { label: 'Suspended', value: suspendedRoutes.length, color: 'bg-red-50 text-red-900' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>}

      {/* Route cards */}
      <div className="space-y-3">
        {routes.map((route: any) => (
          <div key={route.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${route.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Origin → Destination */}
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[60px]">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">From</p>
                  <p className="text-sm font-bold text-slate-900">{route.origin}</p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="h-px w-6 bg-slate-300" />
                  <span className="text-base">✈</span>
                  <div className="h-px w-6 bg-slate-300" />
                </div>
                <div className="text-center min-w-[60px]">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">To</p>
                  <p className="text-sm font-bold text-slate-900">{route.destination}</p>
                </div>
              </div>
              {/* Status + action */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {route.status}
                </span>
                <button
                  onClick={() => toggleStatus(route.id, route.status)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {route.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
            {route.notes && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400 mb-0.5">Stops</p>
                <p className="text-xs text-slate-500 leading-relaxed">{route.notes}</p>
              </div>
            )}
          </div>
        ))}
        {!isLoading && routes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-400">No routes defined yet</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-sm font-medium text-brand-600 hover:underline">Add your first route</button>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">New Route</h2>
            <div className="space-y-3">
              <input placeholder="Route name (auto-generated if blank)" value={form.name} onChange={e => set('name', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Origin</label>
                  <select value={form.origin} onChange={e => set('origin', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-brand-400 focus:outline-none">
                    {ZW_CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Destination</label>
                  <select value={form.destination} onChange={e => set('destination', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-brand-400 focus:outline-none">
                    {ZW_CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none resize-none" />
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleAdd} disabled={createRoute.isPending} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{createRoute.isPending ? 'Saving…' : 'Create Route'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
