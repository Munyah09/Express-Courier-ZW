import { Router } from 'express';
import { createCustomer, getCustomer, searchCustomers, updateCustomer } from '../controllers/customerController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJwt, createCustomer);
router.get('/search', authenticateJwt, searchCustomers);
router.get('/', authenticateJwt, async (_req, res) => {
  const { db } = await import('../lib/supabase');
  try {
    const { data, error } = await db.from('customers').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
router.get('/:customerId', authenticateJwt, getCustomer);
router.patch('/:customerId', authenticateJwt, updateCustomer);

export default router;
