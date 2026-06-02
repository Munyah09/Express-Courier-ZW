import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ── Parcel ────────────────────────────────────────────────────────────────────

export const useParcelTrack = (trackingNumber: string) => {
  return useQuery({
    queryKey: ['parcel', trackingNumber],
    queryFn: async () => {
      const { data } = await api.get(`/parcels/${trackingNumber}`);
      return data.data;
    },
    enabled: !!trackingNumber,
    retry: false
  });
};

export const useListParcels = (limit = 50, offset = 0, filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['parcels', limit, offset, filters],
    queryFn: async () => {
      const { data } = await api.get('/parcels', { params: { limit, offset, ...filters } });
      return data;
    }
  });
};

export const useGetParcel = (parcelId: string) => {
  return useQuery({
    queryKey: ['parcel', 'detail', parcelId],
    queryFn: async () => {
      const { data } = await api.get(`/parcels/detail/${parcelId}`);
      return data.data;
    },
    enabled: !!parcelId,
    retry: false
  });
};

export const useCreateParcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/parcels', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    }
  });
};

export const useUpdateParcelStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parcelId, status, notes }: { parcelId: string; status: string; notes?: string }) => {
      const { data } = await api.patch(`/parcels/${parcelId}/status`, { status, notes });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    }
  });
};

export const useRecordParcelEvent = () => {
  return useMutation({
    mutationFn: async ({
      parcelId,
      eventType,
      description,
      gpsPoint
    }: {
      parcelId: string;
      eventType: string;
      description?: string;
      gpsPoint?: { lat: number; lng: number };
    }) => {
      const { data } = await api.post(`/parcels/${parcelId}/events`, {
        eventType,
        description,
        gpsPoint
      });
      return data.data;
    }
  });
};

// ── Customer ──────────────────────────────────────────────────────────────────

export const useSearchCustomers = (query: string) => {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const { data } = await api.get('/customers/search', { params: { query } });
      return data.data;
    },
    enabled: query.length >= 3
  });
};

export const useListCustomers = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ['customers', 'list', limit, offset],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data.data ?? [];
    }
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/customers', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

// ── Manifest ──────────────────────────────────────────────────────────────────

export const useListManifests = (date?: string) => {
  return useQuery({
    queryKey: ['manifests', date],
    queryFn: async () => {
      const { data } = await api.get('/manifests', { params: { date } });
      return data;
    }
  });
};

export const useGetManifest = (manifestId: string) => {
  return useQuery({
    queryKey: ['manifest', manifestId],
    queryFn: async () => {
      const { data } = await api.get(`/manifests/${manifestId}`);
      return data.data;
    },
    enabled: !!manifestId
  });
};

export const useCreateManifest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/manifests', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    }
  });
};

export const useUpdateManifestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ manifestId, status }: { manifestId: string; status: string }) => {
      const { data } = await api.patch(`/manifests/${manifestId}/status`, { status });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    }
  });
};

// ── Franchise ─────────────────────────────────────────────────────────────────

export const useFranchiseStats = (franchiseId: string) => {
  return useQuery({
    queryKey: ['franchise', franchiseId, 'stats'],
    queryFn: async () => {
      const { data } = await api.get(`/franchises/${franchiseId}/stats`);
      return data.data;
    },
    enabled: !!franchiseId
  });
};

export const useListFranchises = () => {
  return useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const { data } = await api.get('/franchises');
      return data.data ?? [];
    }
  });
};
