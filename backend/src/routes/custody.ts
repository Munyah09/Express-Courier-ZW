import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { db } from '../lib/supabase';

const router = Router();

const CUSTODY_SELECT = `
  id,
  transfer_type,
  parcel_condition,
  from_location,
  to_location,
  from_signature,
  to_signature,
  notes,
  transferred_at,
  acknowledged_at,
  from_user:users!from_user_id(id, first_name, last_name, phone),
  to_user:users!to_user_id(id, first_name, last_name, phone),
  from_vehicle:vehicles!from_vehicle_id(id, registration, type, make_model),
  to_vehicle:vehicles!to_vehicle_id(id, registration, type, make_model)
`;

// Get full chain of custody for a parcel
router.get('/:parcelId', authenticateJwt, async (req, res) => {
  const { parcelId } = req.params;
  const { data, error } = await db
    .from('custody_transfers')
    .select(CUSTODY_SELECT)
    .eq('parcel_id', parcelId)
    .order('transferred_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Initiate a handover (from_user signs, records who they're handing to)
router.post('/:parcelId/handover', authenticateJwt, async (req, res) => {
  const { parcelId } = req.params;
  const {
    fromLocation,
    toUserId,
    toLocation,
    fromVehicleId,
    toVehicleId,
    transferType,
    parcelCondition,
    fromSignature,
    notes,
  } = req.body;

  const fromUserId = (req as any).user?.user?.id;

  if (!fromLocation) return res.status(400).json({ error: 'fromLocation is required' });
  if (!transferType) return res.status(400).json({ error: 'transferType is required' });

  const { data, error } = await db
    .from('custody_transfers')
    .insert({
      parcel_id:        parcelId,
      from_user_id:     fromUserId,
      from_location:    fromLocation,
      from_vehicle_id:  fromVehicleId ?? null,
      to_user_id:       toUserId ?? null,
      to_location:      toLocation ?? null,
      to_vehicle_id:    toVehicleId ?? null,
      from_signature:   fromSignature ?? null,
      transfer_type:    transferType,
      parcel_condition: parcelCondition ?? 'good',
      notes:            notes ?? null,
    })
    .select(CUSTODY_SELECT)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Log parcel event
  await db.from('parcel_events').insert({
    parcel_id:         parcelId,
    event_type:        'Handover',
    event_description: `Handed over at ${fromLocation}${toLocation ? ` → ${toLocation}` : ''}`,
    user_id:           fromUserId,
  });

  res.status(201).json({ data });
});

// Receiver acknowledges receipt by adding their signature
router.patch('/:transferId/acknowledge', authenticateJwt, async (req, res) => {
  const { transferId } = req.params;
  const { toSignature, toLocation, parcelCondition, notes } = req.body;
  const toUserId = (req as any).user?.user?.id;

  const { data, error } = await db
    .from('custody_transfers')
    .update({
      to_signature:     toSignature ?? null,
      to_user_id:       toUserId,
      to_location:      toLocation ?? null,
      parcel_condition: parcelCondition ?? 'good',
      notes:            notes ?? null,
      acknowledged_at:  new Date().toISOString(),
    })
    .eq('id', transferId)
    .select(CUSTODY_SELECT)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

export default router;
