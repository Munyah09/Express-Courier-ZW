import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useListParcels } from '../hooks/useQueries';

const STATUSES = ['', 'Accepted', 'Packed', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed', 'Returned'];

const STATUS_COLORS: Record<string, string> = {
  Accepted: 'bg-blue-100 text-blue-700',
  Packed: 'bg-purple-100 text-purple-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Out For Delivery': 'bg-yellow-100 text-yellow-700',
  Delivered: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Returned: 'bg-slate-100 text-slate-600'
};

const PAGE_SIZE = 25;

export function ParcelsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  // Debounce search — only query when ≥3 chars or empty
  const activeSearch = search.length >= 3 || search.length === 0 ? search : '';

  const filters: Record<string, string> = {};
  if (statusFilter) filters.status = statusFilter;
  if (activeSearch) filters.search = activeSearch;

  const { data, isLoading } = useListParcels(PAGE_SIZE, page * PAGE_SIZE, filters);

  const total = data?.count ?? 0;
  const parcels: any[] = data?.data ?? [];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Parcels</h1>
          <p className="mt-0.5 text-sm text-slate-500">{total.toLocaleString()} total shipments</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          <span>+</span> New Shipment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search tracking number…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tracking</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">Sender</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">Receiver</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">Created</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading &&
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-5 animate-pulse rounded-lg bg-slate-100" />
                  </td>
                </tr>
              ))}

            {!isLoading && parcels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                  No parcels found
                </td>
              </tr>
            )}

            {!isLoading &&
              parcels.map((parcel) => {
                const sender: any = Array.isArray(parcel.sender) ? parcel.sender[0] : parcel.sender;
                const receiver: any = Array.isArray(parcel.receiver) ? parcel.receiver[0] : parcel.receiver;
                return (
                  <tr
                    key={parcel.id}
                    onClick={() => navigate(`/parcels/${parcel.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-medium text-slate-900">{parcel.tracking_number}</span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-700 sm:table-cell">
                      {sender ? `${sender.first_name} ${sender.last_name}` : '—'}
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-700 md:table-cell">
                      {receiver ? `${receiver.first_name} ${receiver.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[parcel.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {parcel.status}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-500 lg:table-cell">
                      {new Date(parcel.created_at).toLocaleDateString('en-ZW')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-brand-600 font-medium">View →</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Page {page + 1} of {totalPages} &bull; {total.toLocaleString()} results
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
