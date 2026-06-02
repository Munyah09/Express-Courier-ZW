import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { db } from '../lib/supabase';

const router = Router();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate OTP for a parcel (called when status → Out For Delivery)
router.post('/:parcelId/generate', authenticateJwt, async (req, res) => {
  const { parcelId } = req.params;

  // Expire any existing OTPs
  await db.from('parcel_otps').update({ verified: true }).eq('parcel_id', parcelId).eq('verified', false);

  const otp_code = generateOTP();
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  const { data, error } = await db
    .from('parcel_otps')
    .insert({ parcel_id: parcelId, otp_code, expires_at, verified: false })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // In production: send OTP via SMS/WhatsApp to receiver
  console.log(`[OTP] Parcel ${parcelId}: ${otp_code}`);

  res.json({ data: { otp_code, expires_at, message: 'OTP generated and sent to receiver' } });
});

// Verify OTP (called on delivery)
router.post('/:parcelId/verify', authenticateJwt, async (req, res) => {
  const { parcelId } = req.params;
  const { otp } = req.body;

  if (!otp) return res.status(400).json({ error: 'OTP is required' });

  const { data: record, error } = await db
    .from('parcel_otps')
    .select('*')
    .eq('parcel_id', parcelId)
    .eq('otp_code', otp.toString())
    .eq('verified', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !record) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Mark as verified
  await db.from('parcel_otps').update({ verified: true, verified_at: new Date().toISOString() }).eq('id', record.id);

  // Update parcel status to Delivered
  await db.from('parcels').update({ status: 'Delivered', delivered_at: new Date().toISOString() }).eq('id', parcelId);

  // Log event
  await db.from('parcel_events').insert({
    parcel_id: parcelId,
    event_type: 'Delivered',
    event_description: 'Delivery confirmed via OTP verification',
    user_id: (req as any).user?.user?.id,
  });

  res.json({ data: { verified: true, message: 'Delivery confirmed' } });
});

// Get current OTP status for a parcel
router.get('/:parcelId/status', authenticateJwt, async (req, res) => {
  const { parcelId } = req.params;
  const { data } = await db
    .from('parcel_otps')
    .select('otp_code, expires_at, verified, verified_at')
    .eq('parcel_id', parcelId)
    .eq('verified', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  res.json({ data: data ?? null });
});

export default router;
