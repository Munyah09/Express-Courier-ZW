import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { db } from '../lib/supabase';

const router = Router();

router.get('/summary', authenticateJwt, async (req, res) => {
  try {
    const { from, to } = req.query as Record<string, string>;
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const [total, byStatus, recentParcels, topCustomers] = await Promise.all([
      db.from('parcels').select('id', { count: 'exact', head: true }).gte('created_at', fromDate).lte('created_at', `${toDate}T23:59:59`),

      db.from('parcels').select('status').gte('created_at', fromDate).lte('created_at', `${toDate}T23:59:59`),

      db.from('parcels')
        .select('id, tracking_number, status, weight, created_at, sender:customers!sender_id(first_name, last_name)')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })
        .limit(50),

      db.from('parcels')
        .select('sender_id, sender:customers!sender_id(first_name, last_name, phone)')
        .gte('created_at', fromDate),
    ]);

    // Aggregate status counts
    const statusCounts: Record<string, number> = {};
    for (const p of byStatus.data ?? []) {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    }

    // Aggregate top senders
    const senderMap: Record<string, { name: string; phone: string; count: number }> = {};
    for (const p of (topCustomers.data ?? []) as any[]) {
      const s = Array.isArray(p.sender) ? p.sender[0] : p.sender;
      if (!s || !p.sender_id) continue;
      if (!senderMap[p.sender_id]) senderMap[p.sender_id] = { name: `${s.first_name} ${s.last_name}`, phone: s.phone, count: 0 };
      senderMap[p.sender_id].count++;
    }
    const topSenders = Object.values(senderMap).sort((a, b) => b.count - a.count).slice(0, 5);

    res.json({
      data: {
        period: { from: fromDate, to: toDate },
        totalParcels: total.count ?? 0,
        statusBreakdown: statusCounts,
        deliveryRate: statusCounts['Delivered']
          ? Math.round((statusCounts['Delivered'] / (total.count ?? 1)) * 100)
          : 0,
        failureRate: statusCounts['Failed']
          ? Math.round((statusCounts['Failed'] / (total.count ?? 1)) * 100)
          : 0,
        recentParcels: recentParcels.data ?? [],
        topSenders,
      }
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
