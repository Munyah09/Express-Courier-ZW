import { useState } from 'react';
import { useListFranchises, useFranchiseStats } from '../hooks/useQueries';

function FranchiseDetail({ franchiseId, name, onBack }: { franchiseId: string; name: string; onBack: () => void }) {
  const { data: stats, isLoading } = useFranchiseStats(franchiseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-slate-900">{name}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <p className="text-sm font-medium text-blue-700">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">${stats?.totalRevenue ?? '0'}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-6">
            <p className="text-sm font-medium text-green-700">Royalties Due</p>
            <p className="mt-2 text-3xl font-bold text-green-900">${stats?.royaltiesDue ?? '0'}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6">
            <p className="text-sm font-medium text-purple-700">Active Parcels</p>
            <p className="mt-2 text-3xl font-bold text-purple-900">{stats?.activeParcels ?? '0'}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Branches</h2>
          <div className="mt-4">
            {stats?.branches && stats.branches.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.branches.map((branch: any) => (
                  <div key={branch.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900">{branch.name}</p>
                      <p className="text-xs text-slate-500">{branch.city}</p>
                    </div>
                    <span className="text-sm font-mono text-slate-400">{branch.code}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No branch data available</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Reports</h2>
          <div className="mt-4 space-y-2">
            <button className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors">
              Revenue Report
            </button>
            <button className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors">
              Royalty Statement
            </button>
            <button className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors">
              Compliance Checklist
            </button>
            <button className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors">
              Agent Commission Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FranchiseConsolePage() {
  const { data: franchises, isLoading } = useListFranchises();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedFranchise = franchises?.find((f: any) => f.id === selectedId);

  if (selectedId && selectedFranchise) {
    return (
      <FranchiseDetail
        franchiseId={selectedId}
        name={selectedFranchise.name}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Franchise Console</h1>
        <p className="mt-1 text-sm text-slate-600">Territory management, commission tracking, and compliance reports</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />)}
        </div>
      )}

      {!isLoading && (!franchises || franchises.length === 0) && (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-400">No franchises found.</p>
          <p className="mt-1 text-sm text-slate-400">Add franchises from the admin panel or database.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(franchises ?? []).map((franchise: any) => (
          <button
            key={franchise.id}
            onClick={() => setSelectedId(franchise.id)}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-brand-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{franchise.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{franchise.territory}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${franchise.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {franchise.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Owner</p>
                <p className="font-medium text-slate-900">{franchise.owner_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Royalty Rate</p>
                <p className="font-medium text-slate-900">{franchise.royalty_rate}%</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
