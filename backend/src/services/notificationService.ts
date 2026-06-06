import nodemailer from 'nodemailer';
import { db } from '../lib/supabase';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

// ── WhatsApp (Meta Cloud API / any REST gateway) ──────────────
async function sendWhatsApp(phoneNumber: string, message: string): Promise<{ success: boolean }> {
  const apiUrl  = process.env.WHATSAPP_API_URL;
  const apiKey  = process.env.WHATSAPP_API_KEY;
  const fromNum = process.env.WHATSAPP_FROM_NUMBER;

  if (!apiUrl || !apiKey || apiUrl.includes('api.whatsapp.com')) {
    // Not configured — log only
    console.log(`[WhatsApp] → ${phoneNumber}\n${message}\n`);
    return { success: true };
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:    phoneNumber.replace(/\s+/g, '').replace(/^\+/, ''),
        type:  'text',
        text:  { body: message },
        ...(fromNum ? { from: fromNum } : {}),
      }),
    });
    return { success: res.ok };
  } catch (err) {
    console.error('[WhatsApp] send error:', err);
    return { success: false };
  }
}

// ── SMS ───────────────────────────────────────────────────────
async function sendSMS(phone: string, message: string): Promise<{ success: boolean }> {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (!apiUrl || !apiKey || apiUrl.includes('sms-provider.com')) {
    console.log(`[SMS] → ${phone}\n${message}\n`);
    return { success: true };
  }

  try {
    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body:    JSON.stringify({ to: phone, message }),
    });
    return { success: res.ok };
  } catch (err) {
    console.error('[SMS] send error:', err);
    return { success: false };
  }
}

// ── Email ─────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean }> {
  try {
    const info = await transporter.sendMail({
      from: `"Starverse Express" <${process.env.EMAIL_SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId } as any;
  } catch (err) {
    console.error('[Email] send error:', err);
    return { success: false };
  }
}

// ── Build the rich WhatsApp notification message ──────────────
function buildStatusMessage(opts: {
  trackingNumber: string;
  status: string;
  receiverName: string;
  handlerName?: string;
  handlerPhone?: string;
  vehicleReg?: string;
  vehicleType?: string;
  currentLocation?: string;
  deliveryLandmark?: string;
  notes?: string;
  trackUrl: string;
}): string {
  const statusEmojis: Record<string, string> = {
    Accepted:           '📥',
    Packed:             '📦',
    'In Transit':       '🚚',
    'Out For Delivery': '🛵',
    Delivered:          '✅',
    Failed:             '❌',
    Returned:           '↩️',
    Handover:           '🤝',
  };

  const emoji = statusEmojis[opts.status] ?? '📍';

  let msg = `*Starverse Express — Parcel Update* ${emoji}\n\n`;
  msg += `Hello ${opts.receiverName},\n\n`;
  msg += `Your parcel *${opts.trackingNumber}* is now:\n`;
  msg += `*${opts.status.toUpperCase()}*\n\n`;

  if (opts.handlerName) {
    msg += `👤 Handler: *${opts.handlerName}*`;
    if (opts.handlerPhone) msg += ` (${opts.handlerPhone})`;
    msg += '\n';
  }

  if (opts.vehicleReg) {
    msg += `🚗 Vehicle: *${opts.vehicleReg}*`;
    if (opts.vehicleType) msg += ` (${opts.vehicleType})`;
    msg += '\n';
  }

  if (opts.currentLocation) {
    msg += `📍 Current location: *${opts.currentLocation}*\n`;
  }

  if (opts.status === 'Out For Delivery' && opts.deliveryLandmark) {
    msg += `🏠 Delivering to: *${opts.deliveryLandmark}*\n`;
  }

  if (opts.notes) {
    msg += `📝 Note: ${opts.notes}\n`;
  }

  msg += `\n🔍 Track: ${opts.trackUrl}`;
  msg += `\n\n_Reply STOP to opt out_`;

  return msg;
}

// ── Main notification trigger ─────────────────────────────────
export async function notifyParcelStatusChange(
  parcelId: string,
  newStatus: string,
  context?: {
    handlerUserId?: string;
    vehicleId?: string;
    currentLocation?: string;
    notes?: string;
  }
) {
  // Fetch parcel with receiver and optional handler/vehicle
  const parcelQ = await db
    .from('parcels')
    .select(`
      id,
      tracking_number,
      delivery_landmark,
      receiver:customers!receiver_id(
        id, first_name, last_name, phone, whatsapp, email
      )
    `)
    .eq('id', parcelId)
    .single();

  if (!parcelQ.data) return;

  const rawReceiver = parcelQ.data.receiver;
  const receiver: any = Array.isArray(rawReceiver) ? rawReceiver[0] : rawReceiver;
  if (!receiver) return;

  // Fetch handler info if provided
  let handlerName: string | undefined;
  let handlerPhone: string | undefined;

  if (context?.handlerUserId) {
    const { data: handler } = await db
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', context.handlerUserId)
      .single();
    if (handler) {
      handlerName  = `${handler.first_name} ${handler.last_name}`;
      handlerPhone = handler.phone;
    }
  }

  // Fetch vehicle info if provided
  let vehicleReg:  string | undefined;
  let vehicleType: string | undefined;

  if (context?.vehicleId) {
    const { data: vehicle } = await db
      .from('vehicles')
      .select('registration, type')
      .eq('id', context.vehicleId)
      .single();
    if (vehicle) {
      vehicleReg  = vehicle.registration;
      vehicleType = vehicle.type;
    }
  }

  const trackUrl    = `https://Starverse.co.zw/track/${parcelQ.data.tracking_number}`;
  const receiverName = `${receiver.first_name} ${receiver.last_name}`.trim();

  const whatsappMsg = buildStatusMessage({
    trackingNumber:   parcelQ.data.tracking_number,
    status:           newStatus,
    receiverName,
    handlerName,
    handlerPhone,
    vehicleReg,
    vehicleType,
    currentLocation:  context?.currentLocation,
    deliveryLandmark: parcelQ.data.delivery_landmark ?? undefined,
    notes:            context?.notes,
    trackUrl,
  });

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <div style="background:#f97316;padding:20px 24px;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0">Starverse Express</h2>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
        <p>Hello <strong>${receiverName}</strong>,</p>
        <p>Your parcel <strong>${parcelQ.data.tracking_number}</strong> status has been updated to <strong>${newStatus}</strong>.</p>
        ${handlerName ? `<p>📦 Handler: <strong>${handlerName}</strong>${handlerPhone ? ` · ${handlerPhone}` : ''}</p>` : ''}
        ${vehicleReg  ? `<p>🚗 Vehicle: <strong>${vehicleReg}</strong> (${vehicleType ?? ''})</p>` : ''}
        ${context?.currentLocation ? `<p>📍 Location: <strong>${context.currentLocation}</strong></p>` : ''}
        <a href="${trackUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Track Parcel
        </a>
      </div>
      <p style="font-size:12px;color:#94a3b8;margin-top:12px;text-align:center">Starverse Express Courier · Zimbabwe 🇿🇼</p>
    </div>
  `;

  const notifications: Promise<any>[] = [];

  // WhatsApp takes priority — use whatsapp number if different from phone
  const waNumber = receiver.whatsapp || receiver.phone;
  if (waNumber)      notifications.push(sendWhatsApp(waNumber, whatsappMsg));
  if (receiver.phone && receiver.phone !== waNumber) notifications.push(sendSMS(receiver.phone, `Starverse Express: ${parcelQ.data.tracking_number} is now ${newStatus}. Track: ${trackUrl}`));
  if (receiver.email) notifications.push(sendEmail(receiver.email, `Parcel Update – ${newStatus} | ${parcelQ.data.tracking_number}`, emailHtml));

  return Promise.allSettled(notifications);
}

// ── Notify on custody handover ────────────────────────────────
export async function notifyHandover(
  parcelId: string,
  fromUserName: string,
  fromLocation: string,
  toUserName: string,
  vehicleReg?: string
) {
  const parcelQ = await db
    .from('parcels')
    .select(`tracking_number, receiver:customers!receiver_id(first_name, last_name, phone, whatsapp)`)
    .eq('id', parcelId)
    .single();

  if (!parcelQ.data) return;
  const rawReceiver = parcelQ.data.receiver;
  const receiver: any = Array.isArray(rawReceiver) ? rawReceiver[0] : rawReceiver;
  if (!receiver) return;

  const trackUrl = `https://Starverse.co.zw/track/${parcelQ.data.tracking_number}`;
  const receiverName = `${receiver.first_name} ${receiver.last_name}`.trim();

  const msg = buildStatusMessage({
    trackingNumber:  parcelQ.data.tracking_number,
    status:          'Handover',
    receiverName,
    handlerName:     toUserName,
    vehicleReg,
    currentLocation: fromLocation,
    notes:           `Transferred from ${fromUserName} to ${toUserName}`,
    trackUrl,
  });

  const waNumber = receiver.whatsapp || receiver.phone;
  if (waNumber) await sendWhatsApp(waNumber, msg);
}

export { sendWhatsApp, sendSMS, sendEmail };
