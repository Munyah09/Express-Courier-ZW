import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ── Parcel ────────────────────────────────────────────────────────────────────

const PARCEL_SELECT = `
  *,
  sender:customers!sender_id(id, first_name, last_name, phone, email, landmark_address),
  receiver:customers!receiver_id(id, first_name, last_name, phone, email, landmark_address),
  events:parcel_events(id, event_type, event_description, created_at, user_id)
`;

export const useParcelTrack = (trackingNumber: string) => {
  return useQuery({
    queryKey: ['parcel', trackingNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select(PARCEL_SELECT)
        .eq('tracking_number', trackingNumber)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!trackingNumber,
    retry: false,
  });
};

export const useListParcels = (limit = 50, offset = 0, filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['parcels', limit, offset, filters],
    queryFn: async () => {
      let q = supabase
        .from('parcels')
        .select(PARCEL_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.search) q = q.ilike('tracking_number', `%${filters.search}%`);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
};

export const useGetParcel = (parcelId: string) => {
  return useQuery({
    queryKey: ['parcel', 'detail', parcelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select(PARCEL_SELECT)
        .eq('id', parcelId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parcelId,
    retry: false,
  });
};

export const useCreateParcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('parcels')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parcels'] }),
  });
};

export const useUpdateParcelStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parcelId, status, notes }: { parcelId: string; status: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('parcels')
        .update({ status, notes: notes ?? undefined, updated_at: new Date().toISOString() })
        .eq('id', parcelId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parcels'] }),
  });
};

export const useRecordParcelEvent = () => {
  return useMutation({
    mutationFn: async ({
      parcelId,
      eventType,
      description,
      gpsPoint,
    }: {
      parcelId: string;
      eventType: string;
      description?: string;
      gpsPoint?: { lat: number; lng: number };
    }) => {
      const { data, error } = await supabase
        .from('parcel_events')
        .insert({
          parcel_id: parcelId,
          event_type: eventType,
          event_description: description,
          gps_point: gpsPoint ? `(${gpsPoint.lng},${gpsPoint.lat})` : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
};

// ── Customer ──────────────────────────────────────────────────────────────────

export const useSearchCustomers = (query: string) => {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length >= 3,
  });
};

export const useListCustomers = (limit = 100, offset = 0) => {
  return useQuery({
    queryKey: ['customers', 'list', limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          first_name: payload.firstName,
          last_name: payload.lastName,
          company_name: payload.companyName,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          email: payload.email,
          customer_type: payload.customerType,
          landmark_address: payload.landmarkAddress,
          physical_address: payload.physicalAddress,
          notes: payload.notes,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, ...payload }: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', customerId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

// ── Manifest ──────────────────────────────────────────────────────────────────

export const useListManifests = (date?: string) => {
  return useQuery({
    queryKey: ['manifests', date],
    queryFn: async () => {
      let q = supabase
        .from('manifests')
        .select(`*, route:routes(id, origin, destination, name), vehicle:vehicles(id, registration, make_model)`)
        .order('created_at', { ascending: false });
      if (date) q = q.eq('manifest_date', date);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useGetManifest = (manifestId: string) => {
  return useQuery({
    queryKey: ['manifest', manifestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manifests')
        .select(`*, route:routes(*), vehicle:vehicles(*)`)
        .eq('id', manifestId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!manifestId,
  });
};

export const useCreateManifest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('manifests')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manifests'] }),
  });
};

export const useUpdateManifestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ manifestId, status }: { manifestId: string; status: string }) => {
      const { data, error } = await supabase
        .from('manifests')
        .update({ status })
        .eq('id', manifestId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manifests'] }),
  });
};

// ── Franchise ─────────────────────────────────────────────────────────────────

export const useListFranchises = () => {
  return useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useFranchiseStats = (franchiseId: string) => {
  return useQuery({
    queryKey: ['franchise', franchiseId, 'stats'],
    queryFn: async () => {
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name, city, code')
        .eq('franchise_id', franchiseId);
      const branchIds = (branches ?? []).map((b: any) => b.id);
      const { count: totalParcels } = await supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .in('branch_id', branchIds.length ? branchIds : ['none']);
      const { count: activeParcels } = await supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .in('branch_id', branchIds.length ? branchIds : ['none'])
        .not('status', 'in', '("Delivered","Failed","Returned")');
      return {
        totalParcels: totalParcels ?? 0,
        branchCount: branchIds.length,
        totalRevenue: 0,
        royaltiesDue: 0,
        activeParcels: activeParcels ?? 0,
        branches: branches ?? [],
      };
    },
    enabled: !!franchiseId,
  });
};
