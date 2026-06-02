import { Request, Response } from 'express';
import { db } from '../lib/supabase';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [inTransit, deliveredToday, pendingOtp, failedDelivery, recentParcels] = await Promise.all([
      db.from('parcels').select('id', { count: 'exact', head: true }).eq('status', 'In Transit'),
      db
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Delivered')
        .gte('delivered_at', `${today}T00:00:00`)
        .lte('delivered_at', `${today}T23:59:59`),
      db.from('parcel_otps').select('id', { count: 'exact', head: true }).eq('verified', false).gt('expires_at', new Date().toISOString()),
      db.from('parcels').select('id', { count: 'exact', head: true }).eq('status', 'Failed'),
      db
        .from('parcels')
        .select(`id, tracking_number, status, created_at, sender:customers!sender_id(first_name, last_name, phone)`)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    res.json({
      data: {
        inTransit: inTransit.count ?? 0,
        deliveredToday: deliveredToday.count ?? 0,
        pendingOtp: pendingOtp.count ?? 0,
        failedDelivery: failedDelivery.count ?? 0,
        recentParcels: recentParcels.data ?? []
      }
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
