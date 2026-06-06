import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';

const VEHICLE_TYPES = [
  'Bicycle', 'Motorcycle', 'Pickup Truck', 'Van', 'Mini Truck', 'Truck',
  'Mushika Shika', 'Kombi / Minibus', 'Long Distance Bus', 'Partner Courier',
];

const TYPE_ICONS: Record<string, string> = {
  Bicycle: '🚲', Motorcycle: '🏍️', 'Pickup Truck': '🛻', Van: '🚐',
  'Mini Truck': '🚚', Truck: '🚛', 'Mushika Shika': '🚗',
  'Kombi / Minibus': '🚌', 'Long Distance Bus': '🚍', 'Partner Courier': '📦',
};

const THIRD_PARTY_TYPES = ['Mushika Shika', 'Kombi / Minibus', 'Long Distance Bus', 'Partner Courier'];

const FUEL_COLORS: Record<string, string> = {
  full: 'bg-green-100 text-green-700', half: 'bg-yellow-100 text-yellow-700', low: 'bg-red-100 text-red-700', empty: 'bg-red-200 text-red-800',
};

function useVehicles() {
  return useQuery({ queryKey: ['vehicles'], queryFn: async () => { const { data } = await api.get('/vehicles'); return data.data ?? []; } });
}

function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload: any) => { const { data } = await api.post('/vehicles', payload); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }) });
}

function usePatchVehicle() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...payload }: any) => { const { data } = await api.patch(`/vehicles/${id}`, payload); return data.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }) });
}

export function VehiclesPage() {
  const notify = useToast();
  const { data: vehicles = [], isLoading } = useVehicles();
  const createVehicle = useCreateVehicle();
  const patchVehicle = usePatchVehicle();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ registration: '', type: 'Van', makeModel: '', mileage: '', fuelStatus: 'full', ownerName: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    const isThirdParty = THIRD_PARTY_TYPES.includes(form.type);
    if (!form.registration && !isThirdParty) { notify('Registration plate is required', 'error'); return; }
    if (isThirdParty && !form.registration) setForm(p => ({ ...p, registration: `3P-${Date.now()}` }));
    try {
      await createVehicle.mutateAsync({ ...form, mileage: Number(form.mileage) || 0, isThirdParty });
      notify('Vehicle added', 'success');
      setShowAdd(false);
      setForm({ registration: '', type: 'Van', makeModel: '', mileage: '', fuelStatus: 'full', ownerName: '' });
    } catch { notify('Failed to add vehicle', 'error'); }
  };

  const toggleFuel = async (id: string, fuelStatus: string) => {
    const next = { full: 'half', half: 'low', low: 'empty', empty: 'full' }[fuelStatus] ?? 'full';
    await patchVehicle.mutateAsync({ id, fuelStatus: next });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Fleet Management</h1>
          <p className="text-sm text-slate-500">{vehicles.length} vehicles registered</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">+ Add Vehicle</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VEHICLE_TYPES.slice(0, 4).map(t => {
          const count = vehicles.filter((v: any) => v.type === t).length;
          return (
            <div key={t} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl">{TYPE_ICONS[t]}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">{t}</p>
            </div>
          );
        })}
      </div>

      {/* Vehicle table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">Type</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">Driver</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fuel</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">Mileage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && [1, 2, 3].map(i => <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>)}
            {!isLoading && vehicles.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-slate-400">No vehicles registered yet</td></tr>}
            {vehicles.map((v: any) => {
              const driver: any = Array.isArray(v.driver) ? v.driver[0] : v.driver;
              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <p className="font-mono font-semibold text-slate-900">{v.registration}</p>
                    <p className="text-xs text-slate-500">{v.make_model || '—'}</p>
                    {THIRD_PARTY_TYPES.includes(v.type) && (
                      <span className="inline-block mt-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">3rd Party</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className="flex items-center gap-1.5"><span>{TYPE_ICONS[v.type]}</span><span>{v.type}</span></span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-700 md:table-cell">
                    {driver ? `${driver.first_name} ${driver.last_name}` : <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleFuel(v.id, v.fuel_status)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${FUEL_COLORS[v.fuel_status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {v.fuel_status || '—'}
                    </button>
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-700 lg:table-cell">{(v.mileage ?? 0).toLocaleString()} km</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add vehicle modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">Register New Vehicle</h2>
            <div className="space-y-3">
              <input placeholder="Registration plate *" value={form.registration} onChange={e => set('registration', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none">
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
              </select>
              <input placeholder="Make & Model (e.g. Toyota Hilux)" value={form.makeModel} onChange={e => set('makeModel', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <input placeholder="Current mileage (km)" type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none" />
              <select value={form.fuelStatus} onChange={e => set('fuelStatus', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none">
                <option value="full">Full</option><option value="half">Half</option><option value="low">Low</option><option value="empty">Empty</option>
              </select>
              {THIRD_PARTY_TYPES.includes(form.type) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700">3rd Party Transport — Additional Info</p>
                  <input placeholder="Owner / Operator name" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
                  <p className="text-xs text-amber-600">Registration is optional for 3rd party vehicles (auto-generated if blank).</p>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleAdd} disabled={createVehicle.isPending} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{createVehicle.isPending ? 'Saving…' : 'Register'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
