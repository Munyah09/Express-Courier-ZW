import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import { authenticateJwt } from '../middleware/auth';
import { db } from '../lib/supabase';

const router = Router();

// List users
router.get('/', authenticateJwt, async (_req, res) => {
  const { data, error } = await db
    .from('users')
    .select('id, email, first_name, last_name, phone, is_active, created_at, role:roles(id, name), branch:branches(id, name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Get single user
router.get('/:userId', authenticateJwt, async (req, res) => {
  const { data, error } = await db.from('users').select('id, email, first_name, last_name, phone, is_active, national_id, role:roles(id, name), branch:branches(id, name)').eq('id', req.params.userId).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ data });
});

// Create user
router.post('/', authenticateJwt, async (req, res) => {
  const { email, password, firstName, lastName, phone, roleId, branchId, franchiseId } = req.body;
  if (!email || !password || !firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'email, password, firstName, lastName, phone are required' });
  }
  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await db.from('users').insert({ email, password_hash, first_name: firstName, last_name: lastName, phone, role_id: roleId, branch_id: branchId, franchise_id: franchiseId, is_active: true }).select('id, email, first_name, last_name, phone, is_active').single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// Update user (toggle active, change role)
router.patch('/:userId', authenticateJwt, async (req, res) => {
  const { userId } = req.params;
  const { isActive, roleId, branchId, phone } = req.body;
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (isActive !== undefined) updates.is_active = isActive;
  if (roleId !== undefined) updates.role_id = roleId;
  if (branchId !== undefined) updates.branch_id = branchId;
  if (phone !== undefined) updates.phone = phone;
  const { data, error } = await db.from('users').update(updates).eq('id', userId).select('id, email, first_name, last_name, phone, is_active').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;
