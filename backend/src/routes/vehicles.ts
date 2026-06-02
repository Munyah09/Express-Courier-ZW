import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { db } from '../lib/supabase';

const router = Router();

router.get('/', authenticateJwt, async (_req, res) => {
  const { data, error } = await db.from('vehicles').select(`*, driver:users!current_driver_id(id, first_name, last_name, phone), branch:branches!branch_id(id, name, city)`).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.post('/', authenticateJwt, async (req, res) => {
  const { registration, type, makeModel, currentDriverId, branchId, mileage, fuelStatus } = req.body;
  if (!registration || !type) return res.status(400).json({ error: 'registration and type are required' });
  const { data, error } = await db.from('vehicles').insert({ registration, type, make_model: makeModel, current_driver_id: currentDriverId, branch_id: branchId, mileage: mileage ?? 0, fuel_status: fuelStatus }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

router.patch('/:vehicleId', authenticateJwt, async (req, res) => {
  const { vehicleId } = req.params;
  const { currentDriverId, fuelStatus, mileage, branchId } = req.body;
  const { data, error } = await db.from('vehicles').update({ current_driver_id: currentDriverId, fuel_status: fuelStatus, mileage, branch_id: branchId, updated_at: new Date().toISOString() }).eq('id', vehicleId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;
