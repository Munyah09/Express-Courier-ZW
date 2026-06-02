import { db } from '../lib/supabase';

/**
 * Customer Service
 * Manages customer records, corporate accounts, and contact information
 */

export interface CreateCustomerInput {
  firstName: string;
  lastName?: string;
  companyName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  landmarkAddress?: string;
  physicalAddress?: string;
  gpsPoint?: { lat: number; lng: number };
  customerType: 'individual' | 'corporate';
  notes?: string;
}

export const customerService = {
  /**
   * Create a new customer
   */
  async createCustomer(input: CreateCustomerInput) {
    const customerCode = `CUST-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

    const { data, error } = await db
      .from('customers')
      .insert({
        customer_code: customerCode,
        first_name: input.firstName,
        last_name: input.lastName,
        company_name: input.companyName,
        phone: input.phone,
        whatsapp: input.whatsapp,
        email: input.email,
        landmark_address: input.landmarkAddress,
        physical_address: input.physicalAddress,
        gps_point: input.gpsPoint ? `POINT(${input.gpsPoint.lng} ${input.gpsPoint.lat})` : null,
        customer_type: input.customerType,
        notes: input.notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string) {
    const { data, error } = await db.from('customers').select('*').eq('id', customerId).single();
    if (error) throw error;
    return data;
  },

  /**
   * Search customers by phone or name
   */
  async searchCustomers(query: string) {
    const { data, error } = await db
      .from('customers')
      .select('*')
      .or(`phone.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data;
  },

  /**
   * Update customer details
   */
  async updateCustomer(customerId: string, updates: Partial<CreateCustomerInput>) {
    const updatePayload: Record<string, unknown> = {};
    if (updates.firstName) updatePayload.first_name = updates.firstName;
    if (updates.lastName) updatePayload.last_name = updates.lastName;
    if (updates.phone) updatePayload.phone = updates.phone;
    if (updates.whatsapp) updatePayload.whatsapp = updates.whatsapp;
    if (updates.email) updatePayload.email = updates.email;
    if (updates.landmarkAddress) updatePayload.landmark_address = updates.landmarkAddress;
    if (updates.physicalAddress) updatePayload.physical_address = updates.physicalAddress;
    if (updates.notes) updatePayload.notes = updates.notes;

    const { data, error } = await db
      .from('customers')
      .update(updatePayload)
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
