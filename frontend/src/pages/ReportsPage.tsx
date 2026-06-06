import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useReports(from, to);

  const breakdown: Record<string, number> = data?.statusBreakdown ?? {};
  const total = data?.totalParcels ?? 0;
  const topSenders: any[] = data?.topSenders ?? [];
  const recent: any[] = data?.recentParcels ?? [];

  const pieData = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  const barData = topSenders.map(s => ({ name: s.name?.split(' ')[0] ?? '?', count: s.count }));

  const exportCSV = () => {
    const rows = [['Tracking Number', 'Status', 'Weight', 'Created', 'Sender']];
    for (const p of recent) {
      const s: any = Array.isArray(p.sender) ? p.sender[0] : p.sender;
      rows.push([p.tracking_number, p.status, p.weight ?? '', new Date(p.created_at).toLocaleDateString(), s ? `${s.first_name} ${s.last_name}` : '']);
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `starverse-report-${from}-to-${to}.csv`;
    a.click();
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString('en-ZW');

    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Starverse Express — OPERATIONS REPORT', pageW / 2, 9, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${from} to ${to}  |  Generated: ${now}`, pageW / 2, 15, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    let y = 26;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Parcels: ${total}`, 15, y); y += 5;
    doc.text(`Delivered: ${breakdown['Delivered'] ?? 0} (${data?.deliveryRate ?? 0}%)`, 15, y); y += 5;
    doc.text(`In Transit: ${breakdown['In Transit'] ?? 0}`, 15, y); y += 5;
    doc.text(`Failed: ${breakdown['Failed'] ?? 0} (${data?.failureRate ?? 0}%)`, 15, y); y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Status Breakdown', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    for (const [status, count] of Object.entries(breakdown)) {
      const pct = total ? Math.round((count / total) * 100) : 0;
      doc.text(`  ${status}: ${count} (${pct}%)`, 15, y); y += 5;
    }
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Top Senders', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    topSenders.forEach((s, i) => {
      doc.text(`  ${i + 1}. ${s.name} — ${s.count} parcels`, 15, y); y += 5;
    });
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Shipments', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (const p of recent.slice(0, 20)) {
      const s: any = Array.isArray(p.sender) ? p.sender[0] : p.sender;
      doc.text(`${p.tracking_number}  |  ${p.status}  |  ${s ? `${s.first_name} ${s.last_name}` : '—'}  |  ${new Date(p.created_at).toLocaleDateString('en-ZW')}`, 15, y);
      y += 5;
      if (y > 270) { doc.addPage(); y = 20; }
    }

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const h = doc.internal.pageSize.getHeight();
    doc.text('Starverse Express Courier · Confidential Operations Report', pageW / 2, h - 5, { align: 'center' });
    doc.save(`starverse-report-${from}-to-${to}.pdf`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(Boolean);
      alert(`Imported ${lines.length - 1} rows from CSV (display only — data not pushed to database in this version).`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Operational performance overview</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
            ↓ CSV
          </button>
          <button onClick={exportPDF} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
            ↓ PDF
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 shadow-sm">
            ↑ Import CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportCSV} className="hidden" />
        </div>
      </div>

      {/* Date range */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <p className="text-xs font-semibold text-slate-400 self-center mr-1">Quick:</p>
          {(['7d','30d','90d'] as const).map(preset => {
            const d = new Date(); d.setDate(d.getDate() - parseInt(preset));
            return (
              <button key={preset} onClick={() => setFrom(toDate(d))} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                {preset}
              </button>
            );
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

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pie chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Status Distribution</h2>
          {pieData.length === 0 && !isLoading && <p className="text-sm text-slate-400">No data for this period</p>}
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} parcels`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.map(entry => (
              <span key={entry.name} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: STATUS_COLORS[entry.name] ?? '#94a3b8' }} />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </div>

        {/* Bar chart — top senders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Top Senders</h2>
          {barData.length === 0 && !isLoading && <p className="text-sm text-slate-400">No data for this period</p>}
          {barData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`${value} parcels`, 'Shipments']} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {topSenders.length > 0 && barData.length === 0 && (
            <div className="space-y-3 mt-2">
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
          )}
        </div>
      </div>

      {/* Status breakdown bars */}
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
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] ?? '#94a3b8' }} />
                </div>
              </div>
            );
          })}
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
