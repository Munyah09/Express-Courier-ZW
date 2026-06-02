import { useState } from 'react';
import { useListManifests, useGetManifest, useUpdateManifestStatus } from '../hooks/useQueries';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const PARCEL_STATUS_COLORS: Record<string, string> = {
  Accepted: 'bg-blue-50 text-blue-700',
  Packed: 'bg-purple-50 text-purple-700',
  Loaded: 'bg-indigo-50 text-indigo-700',
  Dispatched: 'bg-cyan-50 text-cyan-700',
  'In Transit': 'bg-orange-50 text-orange-700',
  'Out For Delivery': 'bg-yellow-50 text-yellow-700',
  Delivered: 'bg-green-50 text-green-700',
  Failed: 'bg-red-50 text-red-700'
};

function ManifestDetail({ manifestId, onBack }: { manifestId: string; onBack: () => void }) {
  const { data: manifest, isLoading } = useGetManifest(manifestId);
  const updateStatus = useUpdateManifestStatus();

  if (isLoading) return <p className="text-center text-slate-500">Loading manifest...</p>;
  if (!manifest) return <p className="text-center text-slate-500">Manifest not found.</p>;

  const handleStatus = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ manifestId, status });
    } catch {
      alert('Failed to update manifest status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Manifest Details</h1>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">Date</p>
            <p className="font-semibold text-slate-900">{manifest.manifest_date}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[manifest.status] || 'bg-slate-100 text-slate-700'}`}>
            {manifest.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Route</p>
            <p className="font-medium text-slate-900">{manifest.route?.name || 'N/A'}</p>
            {manifest.route && (
              <p className="text-xs text-slate-500">{manifest.route.origin} → {manifest.route.destination}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Vehicle</p>
            <p className="font-medium text-slate-900">{manifest.vehicle?.registration || 'N/A'}</p>
            <p className="text-xs text-slate-500">{manifest.vehicle?.type}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Driver</p>
            <p className="font-medium text-slate-900">
              {manifest.driver ? `${manifest.driver.first_name} ${manifest.driver.last_name}` : 'Unassigned'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 flex-wrap">
          {['pending', 'in_transit', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              disabled={manifest.status === s || updateStatus.isPending}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize disabled:opacity-40 ${
                manifest.status === s ? 'bg-brand-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Parcels</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {manifest.parcels?.length || 0}
          </span>
        </div>

        {(!manifest.parcels || manifest.parcels.length === 0) ? (
          <p className="mt-4 text-sm text-slate-500">No parcels assigned to this manifest.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {manifest.parcels.map((parcel: any) => (
              <div key={parcel.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-mono text-sm font-medium text-slate-900">{parcel.tracking_number}</p>
                  <p className="text-xs text-slate-500">
                    {parcel.receiver?.first_name} {parcel.receiver?.last_name}
                    {parcel.receiver?.landmark_address && ` — ${parcel.receiver.landmark_address}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {parcel.weight && (
                    <span className="text-xs text-slate-400">{parcel.weight}kg</span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PARCEL_STATUS_COLORS[parcel.status] || 'bg-slate-50 text-slate-600'}`}>
                    {parcel.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ManifestPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(null);

  const { data, isLoading } = useListManifests(selectedDate);
  const manifests = data?.data ?? [];

  if (selectedManifestId) {
    return <ManifestDetail manifestId={selectedManifestId} onBack={() => setSelectedManifestId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Driver Manifests</h1>
            <p className="mt-1 text-sm text-slate-600">View and manage daily dispatch manifests</p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <p className="text-center text-slate-500">Loading manifests...</p>}

      {!isLoading && manifests.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500">No manifests for {selectedDate}.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {manifests.map((manifest: any) => (
          <button
            key={manifest.id}
            onClick={() => setSelectedManifestId(manifest.id)}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-brand-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{manifest.route?.name || 'No Route'}</p>
                {manifest.route && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {manifest.route.origin} → {manifest.route.destination}
                  </p>
                )}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[manifest.status] || 'bg-slate-100 text-slate-600'}`}>
                {manifest.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Driver</p>
                <p className="font-medium text-slate-900">
                  {manifest.driver ? `${manifest.driver.first_name} ${manifest.driver.last_name}` : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Vehicle</p>
                <p className="font-medium text-slate-900">{manifest.vehicle?.registration || 'N/A'}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
