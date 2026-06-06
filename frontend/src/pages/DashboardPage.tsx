import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data.data;
    },
    refetchInterval: 30_000
  });
}

const STATUS_COLORS: Record<string, string> = {
  Accepted: 'bg-blue-100 text-blue-700',
  Packed: 'bg-purple-100 text-purple-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Out For Delivery': 'bg-yellow-100 text-yellow-700',
  Delivered: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Returned: 'bg-slate-100 text-slate-600'
};

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className="text-xl opacity-70">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
    </div>
  );
}

function QuickAction({ to, label, icon, desc }: { to: string; label: string; icon: string; desc: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-500 hover:shadow-sm transition-all"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-2xl">{icon}</div>
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const statCards = [
    { label: 'In Transit', value: stats?.inTransit ?? '—', color: 'bg-blue-100 text-blue-900', icon: '🚚' },
    { label: 'Delivered Today', value: stats?.deliveredToday ?? '—', color: 'bg-green-100 text-green-900', icon: '✅' },
    { label: 'Pending OTP', value: stats?.pendingOtp ?? '—', color: 'bg-amber-100 text-amber-900', icon: '🔑' },
    { label: 'Failed Delivery', value: stats?.failedDelivery ?? '—', color: 'bg-red-100 text-red-900', icon: '⚠️' }
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">{greeting()},</p>
            <h1 className="text-2xl font-semibold text-slate-900">{user?.firstName} {user?.lastName}</h1>
            <p className="mt-0.5 text-sm capitalize text-brand-700">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-ZW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} value={isLoading ? '...' : s.value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Parcels */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Shipments</h2>
            <Link to="/create" className="text-sm font-medium text-brand-700 hover:underline">+ New</Link>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-50">
              {(stats?.recentParcels ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No shipments yet</p>
              ) : (
                (stats?.recentParcels ?? []).map((parcel: any) => (
                  <div key={parcel.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium text-slate-900">{parcel.tracking_number}</p>
                      <p className="truncate text-xs text-slate-500">
                        {parcel.sender?.first_name} {parcel.sender?.last_name}
                        &nbsp;&middot;&nbsp;
                        {new Date(parcel.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[parcel.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {parcel.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <QuickAction to="/create" label="Create Shipment" icon="📦" desc="Register a new parcel" />
            <QuickAction to="/scan" label="Scan Parcel" icon="🔲" desc="Log scan event on a parcel" />
            <QuickAction to="/tracking" label="Track Parcel" icon="📍" desc="Look up a parcel by tracking number" />
            <QuickAction to="/manifests" label="Today's Manifests" icon="📋" desc="View and manage driver manifests" />
            <QuickAction to="/customers" label="Find Customer" icon="👤" desc="Search or add a customer" />
          </div>
        </div>
      </div>
    </div>
  );
}
