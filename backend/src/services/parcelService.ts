import { db } from '../lib/supabase';

/**
 * Parcel Service
 * Manages parcel lifecycle, tracking, scanning, and delivery
 */

export interface CreateParcelInput {
  senderId: string;
  receiverId: string;
  weight?: number;
  dimensions?: string;
  declaredValue?: number;
  insuranceAmount?: number;
  collectionPointId?: string;
  branchId?: string;
  deliveryLocation?: string;
  deliveryType?: 'home' | 'collection_point' | 'intercity' | 'bike_delivery';
  paymentMethod?: 'cash' | 'ecocash' | 'swipe' | 'zipit' | 'account';
  fragile?: boolean;
  requiresSignature?: boolean;
  deliveryCharge?: number;
  deliveryZone?: string;
  pickupLandmark?: string;
  deliveryLandmark?: string;
  notes?: string;
}

export const parcelService = {
  /**
   * Generate unique tracking number
   */
  generateTrackingNumber(): string {
    return `ME-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  },

  /**
   * Create a new parcel
   */
  async createParcel(input: CreateParcelInput) {
    const trackingNumber = this.generateTrackingNumber();

    // Build extended metadata — stored in notes until DB migration adds dedicated columns
    const meta: Record<string, any> = {};
    if (input.deliveryType)      meta.delivery_type       = input.deliveryType;
    if (input.paymentMethod)     meta.payment_method      = input.paymentMethod;
    if (input.deliveryCharge)    meta.delivery_charge     = input.deliveryCharge;
    if (input.pickupLandmark)    meta.pickup_landmark     = input.pickupLandmark;
    if (input.deliveryLandmark)  meta.delivery_landmark   = input.deliveryLandmark;
    if (input.fragile)           meta.fragile             = input.fragile;
    if (input.requiresSignature) meta.requires_signature  = input.requiresSignature;
    if (input.deliveryZone)      meta.delivery_zone       = input.deliveryZone;

    const metaSuffix = Object.keys(meta).length
      ? `\n---\n${JSON.stringify(meta)}`
      : '';

    const { data, error } = await db
      .from('parcels')
      .insert({
        tracking_number:     trackingNumber,
        sender_id:           input.senderId,
        receiver_id:         input.receiverId,
        weight:              input.weight,
        dimensions:          input.dimensions,
        declared_value:      input.declaredValue,
        insurance_amount:    input.insuranceAmount,
        collection_point_id: input.collectionPointId,
        branch_id:           input.branchId,
        status:              'Accepted',
        notes:               (input.notes || '') + metaSuffix || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Attach extended fields to returned object so frontend can use them
    if (data && Object.keys(meta).length) {
      Object.assign(data, meta);
    }

    // Log initial acceptance event
    await this.recordParcelEvent(data.id, 'Accepted', 'Parcel accepted into system');

    return data;
  },

  /**
   * Get parcel by tracking number
   */
  async getParcelByTracking(trackingNumber: string) {
    const { data, error } = await db
      .from('parcels')
      .select(
        `
        *,
        sender:customers!sender_id(id, first_name, last_name, phone, landmark_address),
        receiver:customers!receiver_id(id, first_name, last_name, phone, landmark_address),
        events:parcel_events(id, event_type, created_at, event_description),
        photos:parcel_photos(id, url, photo_type)
      `
      )
      .eq('tracking_number', trackingNumber)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get parcel by ID
   */
  async getParcel(parcelId: string) {
    const { data, error } = await db
      .from('parcels')
      .select(
        `
        *,
        sender:customers!sender_id(id, first_name, last_name, phone),
        receiver:customers!receiver_id(id, first_name, last_name, phone),
        events:parcel_events(id, event_type, created_at, event_description, gps_point)
      `
      )
      .eq('id', parcelId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update parcel status
   */
  async updateParcelStatus(parcelId: string, status: string, notes?: string) {
    const { data, error } = await db
      .from('parcels')
      .update({ status, notes })
      .eq('id', parcelId)
      .select()
      .single();

    if (error) throw error;

    // Record status change event
    await this.recordParcelEvent(parcelId, status, notes || '');

    return data;
  },

  /**
   * Record parcel event (scan, handoff, delivery, etc)
   */
  async recordParcelEvent(
    parcelId: string,
    eventType: string,
    description: string,
    userId?: string,
    branchId?: string,
    gpsPoint?: { lat: number; lng: number },
    photoUrl?: string
  ) {
    const { data, error } = await db
      .from('parcel_events')
      .insert({
        parcel_id: parcelId,
        event_type: eventType,
        event_description: description,
        user_id: userId,
        branch_id: branchId,
        gps_point: gpsPoint ? `POINT(${gpsPoint.lng} ${gpsPoint.lat})` : null,
        photo_url: photoUrl
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * List parcels with optional filters
   */
  async listParcels(limit = 50, offset = 0, filters?: { status?: string; branchId?: string; search?: string }) {
    let query = db.from('parcels').select(
      `
      id,
      tracking_number,
      status,
      weight,
      declared_value,
      sender:customers!sender_id(first_name, last_name, phone),
      receiver:customers!receiver_id(first_name, last_name, phone),
      created_at,
      updated_at
    `,
      { count: 'exact' }
    );

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.branchId) {
      query = query.eq('branch_id', filters.branchId);
    }
    if (filters?.search) {
      query = query.ilike('tracking_number', `%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, total: count };
  }
};
