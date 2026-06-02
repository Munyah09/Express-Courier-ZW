import { db } from '../lib/supabase';

/**
 * Franchise Service
 * Manages franchise operations, royalties, and multi-tenant logic
 */

export interface CreateFranchiseInput {
  name: string;
  ownerName: string;
  territory: string;
  royaltyRate: number;
}

export const franchiseService = {
  /**
   * Create new franchise
   */
  async createFranchise(input: CreateFranchiseInput) {
    const { data, error } = await db
      .from('franchises')
      .insert({
        name: input.name,
        owner_name: input.ownerName,
        territory: input.territory,
        royalty_rate: input.royaltyRate,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get franchise by ID
   */
  async getFranchise(franchiseId: string) {
    const { data, error } = await db
      .from('franchises')
      .select(
        `
        *,
        branches(id, name, city),
        users:users(id, email, first_name)
      `
      )
      .eq('id', franchiseId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get franchise revenue and statistics
   */
  async getFranchiseStats(franchiseId: string) {
    const { data, error } = await db.rpc('get_franchise_stats', { franchise_id: franchiseId });

    if (error) throw error;
    return data;
  },

  /**
   * List all franchises
   */
  async listFranchises() {
    const { data, error } = await db.from('franchises').select('*').eq('is_active', true);

    if (error) throw error;
    return data;
  }
};

/**
 * Delivery Service
 * Manages delivery and collection operations
 */

export interface CreateDeliveryInput {
  parcelId: string;
  deliveryType: 'home' | 'collection_point' | 'intercity';
  collectionPointId?: string;
  notes?: string;
}

export const deliveryService = {
  /**
   * Create delivery record
   */
  async createDelivery(input: CreateDeliveryInput, userId: string) {
    const { data, error } = await db
      .from('deliveries')
      .insert({
        parcel_id: input.parcelId,
        delivery_type: input.deliveryType,
        collection_point_id: input.collectionPointId,
        delivered_by: userId,
        status: 'pending',
        note: input.notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark delivery as complete
   */
  async completeDelivery(deliveryId: string) {
    const { data, error } = await db
      .from('deliveries')
      .update({ status: 'completed', delivered_at: new Date().toISOString() })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Record failed delivery attempt
   */
  async failDelivery(deliveryId: string, reason: string) {
    const { data, error } = await db
      .from('deliveries')
      .update({ status: 'failed', note: reason })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get delivery status
   */
  async getDelivery(deliveryId: string) {
    const { data, error } = await db
      .from('deliveries')
      .select(
        `
        *,
        parcel:parcels(tracking_number, sender:customers!sender_id(first_name, phone), receiver:customers!receiver_id(first_name, phone)),
        collection_point:collection_points(name, address)
      `
      )
      .eq('id', deliveryId)
      .single();

    if (error) throw error;
    return data;
  }
};
