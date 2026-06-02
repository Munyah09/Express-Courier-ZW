import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  Accepted: '#3b82f6', Packed: '#8b5cf6', 'In Transit': '#f97316',
  'Out For Delivery': '#eab308', Delivered: '#22c55e', Failed: '#ef4444', Returned: '#94a3b8',
};

function useReports(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', from, to],
    queryFn: async () => { const { data } = await api.get('/reports/summary', { params: { from, to } }); return data.data; },
    enabled: !!from && !!to,
  });
}

function toDate(d: Date) { return d.toISOString().split('T')[0]; }

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}

export function ReportsPage() {
  const today = new Date();
  const [from, setFrom] = useState(toDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(toDate(today));

  const { data, isLoading } = useReports(from, to);

  const breakdown: Record<string, number> = data?.statusBreakdown ?? {};
  const total = data?.totalParcels ?? 0;
  const topSenders: any[] = data?.topSenders ?? [];
  const recent: any[] = data?.recentParcels ?? [];

  const exportCSV = () => {
    const rows = [['Tracking Number', 'Status', 'Weight', 'Created', 'Sender']];
    for (const p of recent) {
      const s: any = Array.isArray(p.sender) ? p.sender[0] : p.sender;
      rows.push([p.tracking_number, p.status, p.weight ?? '', new Date(p.created_at).toLocaleDateString(), s ? `${s.first_name} ${s.last_name}` : '']);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `mufasa-report-${from}-to-${to}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Operational performance overview</p>
        </div>
        <button onClick={exportCSV} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
          ↓ Export CSV
        </button>
      </div>

      {/* Date range */}
      <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
        </div>
        <div className="flex items-end gap-2">
          {(['7d','30d','90d'] as const).map(preset => {
            const d = new Date(); d.setDate(d.getDate() - parseInt(preset));
            return <button key={preset} onClick={() => setFrom(toDate(d))} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">{preset}</button>;
          })}
        </div>
      </div>

      {/* KPI stats */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Parcels" value={total} color="bg-blue-100 text-blue-900" />
          <StatCard label="Delivered" value={breakdown['Delivered'] ?? 0} sub={`${data?.deliveryRate ?? 0}% delivery rate`} color="bg-green-100 text-green-900" />
          <StatCard label="In Transit" value={breakdown['In Transit'] ?? 0} color="bg-orange-100 text-orange-900" />
          <StatCard label="Failed" value={breakdown['Failed'] ?? 0} sub={`${data?.failureRate ?? 0}% failure rate`} color="bg-red-100 text-red-900" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Status Breakdown</h2>
          {Object.entries(breakdown).length === 0 && !isLoading && <p className="text-sm text-slate-400">No data for this period</p>}
          <div className="space-y-3">
            {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-800">{status}</span>
                    <span className="text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] ?? '#94a3b8' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top senders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Top Senders</h2>
          {topSenders.length === 0 && !isLoading && <p className="text-sm text-slate-400">No data for this period</p>}
          <div className="space-y-3">
            {topSenders.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{i + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.phone}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">{s.count} parcels</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent parcels table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent Shipments ({recent.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tracking</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">Sender</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && [1,2,3].map(i => <tr key={i}><td colSpan={4}><div className="mx-5 my-3 h-5 animate-pulse rounded bg-slate-100" /></td></tr>)}
            {recent.slice(0, 20).map(p => {
              const s: any = Array.isArray(p.sender) ? p.sender[0] : p.sender;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">{p.tracking_number}</td>
                  <td className="hidden px-5 py-3 text-slate-700 sm:table-cell">{s ? `${s.first_name} ${s.last_name}` : '—'}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${STATUS_COLORS[p.status] ?? '#94a3b8'}22`, color: STATUS_COLORS[p.status] ?? '#64748b' }}>{p.status}</span>
                  </td>
                  <td className="hidden px-5 py-3 text-slate-500 md:table-cell">{new Date(p.created_at).toLocaleDateString('en-ZW')}</td>
                </tr>
              );
            })}
            {!isLoading && recent.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-slate-400">No parcels in this period</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
