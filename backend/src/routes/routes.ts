import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { db } from '../lib/supabase';

const router = Router();

router.get('/', authenticateJwt, async (_req, res) => {
  const { data, error } = await db.from('routes').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.post('/', authenticateJwt, async (req, res) => {
  const { name, origin, destination, notes } = req.body;
  if (!name || !origin || !destination) return res.status(400).json({ error: 'name, origin and destination are required' });
  const { data, error } = await db.from('routes').insert({ name, origin, destination, notes, status: 'active' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.patch('/:routeId', authenticateJwt, async (req, res) => {
  const { routeId } = req.params;
  const { status, notes } = req.body;
  const { data, error } = await db.from('routes').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', routeId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;
