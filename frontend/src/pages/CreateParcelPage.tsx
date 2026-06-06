import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useSearchCustomers, useCreateCustomer, useCreateParcel } from '../hooks/useQueries';
import { useToast } from '../components/Toast';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  landmark_address?: string;
  customer_type: string;
}

interface ParcelDetails {
  weight: string;
  dimensions: string;
  declaredValue: string;
  insuranceAmount: string;
  deliveryType: 'home' | 'collection_point' | 'intercity' | 'bike_delivery';
  paymentMethod: 'cash' | 'ecocash' | 'swipe' | 'zipit' | 'account';
  deliveryCharge: string;
  pickupDescription: string;
  deliveryDescription: string;
  notes: string;
  fragile: boolean;
  requiresSignature: boolean;
}

// ── PDF generation via jspdf ─────────────────────────────────────────────
async function generateShipmentPDF(
  trackingNumber: string,
  sender: Customer,
  receiver: Customer,
  details: ParcelDetails,
  docType: 'waybill' | 'departure_note' | 'delivery_note'
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString('en-ZW');

  const titles: Record<string, string> = {
    waybill: 'WAYBILL',
    departure_note: 'DEPARTURE NOTE',
    delivery_note: 'DELIVERY NOTE',
  };

  // Header bar
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Starverse Express Courier', 15, 9);
  doc.setFontSize(10);
  doc.text(titles[docType], pageW - 15, 9, { align: 'right' });
  doc.setFontSize(8);
  doc.text("Zimbabwe's Courier, Your Way", 15, 15);
  doc.text(now, pageW - 15, 15, { align: 'right' });

  // Tracking number
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(trackingNumber, pageW / 2, 32, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Tracking Number', pageW / 2, 37, { align: 'center' });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 41, pageW - 15, 41);

  // Sender / Receiver columns
  const col1 = 15, col2 = pageW / 2 + 5;
  let y = 48;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SENDER', col1, y);
  doc.text('RECEIVER', col2, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(`${sender.first_name} ${sender.last_name}`, col1, y);
  doc.text(`${receiver.first_name} ${receiver.last_name}`, col2, y);
  y += 4;
  doc.text(sender.phone, col1, y);
  doc.text(receiver.phone, col2, y);
  if (sender.landmark_address || receiver.landmark_address) {
    y += 4;
    doc.setFontSize(8);
    if (sender.landmark_address) doc.text(sender.landmark_address, col1, y, { maxWidth: pageW / 2 - 20 });
    if (receiver.landmark_address) doc.text(receiver.landmark_address, col2, y, { maxWidth: pageW / 2 - 20 });
    y += 8;
  } else {
    y += 6;
  }

  // Pickup / Delivery locations
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageW - 15, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PICKUP FROM', col1, y);
  doc.text('DELIVER TO', col2, y);
  doc.setFont('helvetica', 'normal');
  y += 4;
  doc.setFontSize(8);
  const pickupLines = doc.splitTextToSize(details.pickupDescription || '—', pageW / 2 - 20);
  const deliveryLines = doc.splitTextToSize(details.deliveryDescription || '—', pageW / 2 - 20);
  const maxLines = Math.max(pickupLines.length, deliveryLines.length);
  doc.text(pickupLines, col1, y);
  doc.text(deliveryLines, col2, y);
  y += maxLines * 4 + 4;

  // Parcel details table
  doc.line(15, y, pageW - 15, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PARCEL DETAILS', col1, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const rows: [string, string][] = [
    ['Weight', `${details.weight} kg`],
    ['Dimensions', details.dimensions || '—'],
    ['Delivery Type', details.deliveryType.replace(/_/g, ' ')],
    ['Payment Method', details.paymentMethod],
    ['Declared Value', details.declaredValue ? `$${details.declaredValue}` : '—'],
    ['Insurance', details.insuranceAmount ? `$${details.insuranceAmount}` : '—'],
    ['Delivery Charge', details.deliveryCharge ? `$${details.deliveryCharge}` : 'Standard rate'],
    ['Fragile', details.fragile ? 'YES — Handle with care' : 'No'],
    ['Signature Required', details.requiresSignature ? 'YES' : 'No'],
    ['Notes', details.notes || '—'],
  ];

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, col1 + 38, y);
    y += 5;
  }

  // Signature block
  y = Math.max(y, 190);
  doc.line(15, y, pageW - 15, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTURE CHECKER', col1, y);
  doc.text('RECEIVING CHECKER', col2, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: ________________________________', col1, y);
  doc.text('Name: ________________________________', col2, y);
  y += 7;
  doc.text('Signature: ___________________________', col1, y);
  doc.text('Signature: ___________________________', col2, y);
  y += 7;
  doc.text('Date/Time: ___________________________', col1, y);
  doc.text('Date/Time: ___________________________', col2, y);

  if (docType !== 'waybill') {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('SECURITY COUNT', col1, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Name: ________________________________', col1, y);
    doc.text('Count verified: ______________________', col2, y);
    y += 7;
    doc.text('Signature: ___________________________', col1, y);
    doc.text('Date/Time: ___________________________', col2, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 8;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Starverse Express Courier · Zimbabwe · Chain of Custody Document', pageW / 2, footerY, { align: 'center' });

  doc.save(`${docType}-${trackingNumber}.pdf`);
}

// ── Post-creation modal: QR code + documents ─────────────────────────────
function ShipmentSuccessModal({
  trackingNumber,
  sender,
  receiver,
  details,
  onClose,
  onViewShipment,
}: {
  trackingNumber: string;
  sender: Customer;
  receiver: Customer;
  details: ParcelDetails;
  onClose: () => void;
  onViewShipment: () => void;
}) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  const downloadQR = () => {
    const canvas = document.getElementById('shipment-qr') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${trackingNumber}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-500 px-6 py-5 text-center">
          <div className="text-3xl mb-1">✅</div>
          <h2 className="text-xl font-bold text-white">Shipment Created!</h2>
          <p className="text-brand-100 text-sm mt-1">Tracking number generated successfully</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Tracking number */}
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Tracking Number</p>
            <p className="font-mono text-2xl font-black text-slate-900 tracking-wider">{trackingNumber}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4">
              <QRCodeCanvas
                id="shipment-qr"
                value={trackingNumber}
                size={160}
                level="H"
                includeMargin={false}
                ref={qrRef}
              />
            </div>
            <p className="text-xs text-slate-500 text-center">Scan this QR code to track the parcel.<br/>The tracking number is encoded inside.</p>
            <button
              onClick={downloadQR}
              className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
            >
              ↓ Download QR Code (PNG)
            </button>
          </div>

          {/* PDF documents */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Shipment Documents</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'waybill' as const, label: 'Waybill', icon: '📄' },
                { type: 'departure_note' as const, label: 'Departure Note', icon: '📋' },
                { type: 'delivery_note' as const, label: 'Delivery Note', icon: '📃' },
              ].map(doc => (
                <button
                  key={doc.type}
                  onClick={() => generateShipmentPDF(trackingNumber, sender, receiver, details, doc.type)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 py-3 px-2 text-center hover:border-brand-400 hover:bg-brand-50 transition-all"
                >
                  <span className="text-xl">{doc.icon}</span>
                  <span className="text-xs font-semibold text-slate-700">{doc.label}</span>
                  <span className="text-[10px] text-slate-400">PDF</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              + New Shipment
            </button>
            <button
              onClick={onViewShipment}
              className="flex-1 rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              View Shipment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Customer search + select ──────────────────────────────────
function CustomerSelector({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: Customer | null;
  onSelect: (c: Customer) => void;
}) {
  const [phone, setPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '', lastName: '', phone: '', whatsapp: '',
    email: '', landmarkAddress: '', customerType: 'individual' as const,
  });
  const createCustomer = useCreateCustomer();
  const notify = useToast();

  const { data: matches, isLoading } = useSearchCustomers(phone);

  const handleAdd = async () => {
    if (!newCustomer.firstName || !newCustomer.phone) {
      notify('First name and phone are required', 'error'); return;
    }
    try {
      const created = await createCustomer.mutateAsync(newCustomer);
      onSelect(created);
      setShowAddForm(false);
      setPhone('');
      notify('Customer created and selected', 'success');
    } catch (err: any) {
      notify(err?.response?.data?.error || 'Failed to create customer', 'error');
    }
  };

  if (selected) {
    return (
      <div className="rounded-2xl border-2 border-brand-400 bg-brand-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {selected.first_name} {selected.last_name}
            </p>
            <p className="text-sm text-slate-600">{selected.phone}</p>
            {selected.landmark_address && (
              <p className="text-xs text-slate-500">{selected.landmark_address}</p>
            )}
          </div>
          <button
            onClick={() => { onSelect(null as any); setPhone(''); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>

      <div className="relative">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Search by phone number (min 3 digits)"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {isLoading && (
          <div className="absolute right-3 top-3 h-5 w-5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
        )}
      </div>

      {matches && matches.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {matches.slice(0, 5).map((c: Customer) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setPhone(''); }}
              className="flex w-full items-center justify-between border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-brand-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-slate-500">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
                {c.landmark_address && <p className="text-xs text-slate-400">{c.landmark_address}</p>}
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                Select
              </span>
            </button>
          ))}
        </div>
      )}

      {matches && matches.length === 0 && phone.length >= 3 && (
        <p className="text-sm text-slate-500">No customers found for "{phone}"</p>
      )}

      {!showAddForm ? (
        <button
          onClick={() => { setShowAddForm(true); setNewCustomer(p => ({ ...p, phone })); }}
          className="w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700 transition-colors"
        >
          + Add New Customer
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">New Customer</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First name *" value={newCustomer.firstName} onChange={(e) => setNewCustomer(p => ({ ...p, firstName: e.target.value }))} className="col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            <input placeholder="Last name" value={newCustomer.lastName} onChange={(e) => setNewCustomer(p => ({ ...p, lastName: e.target.value }))} className="col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          </div>
          <input placeholder="Phone *" value={newCustomer.phone} onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          <input placeholder="WhatsApp (if different)" value={newCustomer.whatsapp} onChange={(e) => setNewCustomer(p => ({ ...p, whatsapp: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          <input placeholder="Email (optional)" value={newCustomer.email} onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          <input placeholder="Nearest landmark or area (optional)" value={newCustomer.landmarkAddress} onChange={(e) => setNewCustomer(p => ({ ...p, landmarkAddress: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-white">Cancel</button>
            <button onClick={handleAdd} disabled={createCustomer.isPending} className="flex-1 rounded-xl bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {createCustomer.isPending ? 'Saving…' : 'Save & Select'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="mb-1 text-xs text-slate-400 leading-relaxed">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';
const TEXTAREA = `${INPUT} resize-none leading-relaxed`;

function Steps({ current }: { current: number }) {
  const steps = ['Sender', 'Receiver', 'Parcel Details', 'Review'];
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-1">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {done ? '✓' : n}
            </div>
            <span className={`hidden text-xs font-medium lg:block ${active ? 'text-brand-700' : 'text-slate-400'}`}>{label}</span>
            {i < steps.length - 1 && <div className={`mx-1 h-px w-4 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

const DEFAULT_DETAILS: ParcelDetails = {
  weight: '',
  dimensions: '',
  declaredValue: '',
  insuranceAmount: '',
  deliveryType: 'home',
  paymentMethod: 'cash',
  deliveryCharge: '',
  pickupDescription: '',
  deliveryDescription: '',
  notes: '',
  fragile: false,
  requiresSignature: false,
};

const DELIVERY_TYPES = [
  { v: 'home',             label: 'Home Delivery',    icon: '🏠', desc: 'Door-to-door' },
  { v: 'collection_point', label: 'Collection Point', icon: '📍', desc: 'Pick up at depot' },
  { v: 'intercity',        label: 'Intercity',        icon: '🚚', desc: 'Cross-city route' },
  { v: 'bike_delivery',    label: 'Bike Delivery',    icon: '🚲', desc: 'Local rider, custom rate' },
] as const;

export function CreateParcelPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const createParcel = useCreateParcel();

  const [step, setStep] = useState(1);
  const [sender, setSender] = useState<Customer | null>(null);
  const [receiver, setReceiver] = useState<Customer | null>(null);
  const [details, setDetails] = useState<ParcelDetails>(DEFAULT_DETAILS);
  const [successData, setSuccessData] = useState<{ trackingNumber: string; parcelId: string } | null>(null);

  const setDetail = (k: keyof ParcelDetails, v: any) =>
    setDetails((p) => ({ ...p, [k]: v }));

  const canProceed = () => {
    if (step === 1) return !!sender;
    if (step === 2) return !!receiver;
    if (step === 3) return !!details.weight && Number(details.weight) > 0;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      const msgs: Record<number, string> = {
        1: 'Please select or create a sender before continuing',
        2: 'Please select or create a receiver before continuing',
        3: 'Weight is required',
      };
      notify(msgs[step] ?? 'Please complete this step', 'error');
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!sender || !receiver) {
      notify('Sender and receiver are required', 'error'); return;
    }
    try {
      const parcel = await createParcel.mutateAsync({
        senderId:          sender.id,
        receiverId:        receiver.id,
        weight:            Number(details.weight),
        dimensions:        details.dimensions       || undefined,
        declaredValue:     details.declaredValue    ? Number(details.declaredValue)    : undefined,
        insuranceAmount:   details.insuranceAmount  ? Number(details.insuranceAmount)  : undefined,
        deliveryCharge:    details.deliveryCharge   ? Number(details.deliveryCharge)   : undefined,
        deliveryType:      details.deliveryType,
        paymentMethod:     details.paymentMethod,
        pickupLandmark:    details.pickupDescription  || undefined,
        deliveryLandmark:  details.deliveryDescription || undefined,
        notes:             details.notes             || undefined,
        fragile:           details.fragile,
        requiresSignature: details.requiresSignature,
      });
      setSuccessData({ trackingNumber: parcel.tracking_number, parcelId: parcel.id });
    } catch (err: any) {
      notify(err?.response?.data?.error || 'Failed to create shipment', 'error');
    }
  };

  const resetForm = () => {
    setStep(1);
    setSender(null);
    setReceiver(null);
    setDetails(DEFAULT_DETAILS);
    setSuccessData(null);
  };

  return (
    <>
      {successData && sender && receiver && (
        <ShipmentSuccessModal
          trackingNumber={successData.trackingNumber}
          sender={sender}
          receiver={receiver}
          details={details}
          onClose={resetForm}
          onViewShipment={() => navigate(`/parcels/${successData.parcelId}`)}
        />
      )}

      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">New Shipment</h1>
              <p className="mt-0.5 text-sm text-slate-500">Complete all 4 steps to create the shipment</p>
            </div>
            <Steps current={step} />
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          {/* Step 1: Sender */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 1 — Sender</h2>
              <p className="text-sm text-slate-500">Who is sending this parcel?</p>
              <CustomerSelector label="Sender" selected={sender} onSelect={setSender} />
            </div>
          )}

          {/* Step 2: Receiver */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 2 — Receiver</h2>
              <p className="text-sm text-slate-500">Who will receive this parcel?</p>
              <CustomerSelector label="Receiver" selected={receiver} onSelect={setReceiver} />
            </div>
          )}

          {/* Step 3: Parcel details */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Step 3 — Parcel Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Weight (kg) *">
                  <input type="number" step="0.1" min="0.1" value={details.weight} onChange={(e) => setDetail('weight', e.target.value)} placeholder="e.g. 2.5" className={INPUT} />
                </Field>
                <Field label="Dimensions (L×W×H cm)">
                  <input type="text" value={details.dimensions} onChange={(e) => setDetail('dimensions', e.target.value)} placeholder="e.g. 30×20×15" className={INPUT} />
                </Field>
                <Field label="Declared Value (USD)">
                  <input type="number" step="0.01" min="0" value={details.declaredValue} onChange={(e) => setDetail('declaredValue', e.target.value)} placeholder="0.00" className={INPUT} />
                </Field>
                <Field label="Insurance Amount (USD)">
                  <input type="number" step="0.01" min="0" value={details.insuranceAmount} onChange={(e) => setDetail('insuranceAmount', e.target.value)} placeholder="0.00" className={INPUT} />
                </Field>
              </div>

              <Field label="Delivery Type">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DELIVERY_TYPES.map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setDetail('deliveryType', opt.v)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-medium transition-all ${details.deliveryType === opt.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-slate-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">📍</span>
                  <div>
                    <p className="text-sm font-bold text-brand-800">Zimbabwean Location Descriptions</p>
                    <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">
                      No street address needed — describe it the way you'd tell a taxi driver or a neighbour.
                    </p>
                  </div>
                </div>

                <Field
                  label="Pickup Location"
                  hint='E.g. "Near Mr Also groceries, along Gweru–Kwekwe road, blue gate opposite the school"'
                >
                  <textarea
                    rows={3}
                    value={details.pickupDescription}
                    onChange={(e) => setDetail('pickupDescription', e.target.value)}
                    placeholder="Describe the pickup spot as you'd explain it to a local driver…"
                    className={TEXTAREA}
                  />
                </Field>

                <Field
                  label="Delivery Location"
                  hint='E.g. "Zvishavane town, past Zimasco gates, green-roofed house next to Bon Marche on left"'
                >
                  <textarea
                    rows={3}
                    value={details.deliveryDescription}
                    onChange={(e) => setDetail('deliveryDescription', e.target.value)}
                    placeholder="Describe the drop-off spot as you'd explain it to a local driver…"
                    className={TEXTAREA}
                  />
                </Field>
              </div>

              <Field label="Payment Method">
                <div className="flex flex-wrap gap-2">
                  {(['cash', 'ecocash', 'swipe', 'zipit', 'account'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDetail('paymentMethod', m)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all ${details.paymentMethod === m ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Delivery Charge (USD)"
                hint="Set the price manually — all charges are custom. Leave blank if not yet agreed."
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number" step="0.50" min="0"
                    value={details.deliveryCharge}
                    onChange={(e) => setDetail('deliveryCharge', e.target.value)}
                    placeholder="0.00"
                    className={`${INPUT} pl-8`}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Use the{' '}
                  <button type="button" onClick={() => window.open('/pricing', '_blank')} className="text-brand-600 underline">
                    pricing advisor
                  </button>
                  {' '}for guidance on rates.
                </p>
              </Field>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={details.fragile} onChange={(e) => setDetail('fragile', e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-500" />
                  <span className="text-sm font-medium text-slate-700">⚠️ Fragile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={details.requiresSignature} onChange={(e) => setDetail('requiresSignature', e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-500" />
                  <span className="text-sm font-medium text-slate-700">✍️ Signature Required</span>
                </label>
              </div>

              <Field label="Notes (optional)">
                <textarea value={details.notes} onChange={(e) => setDetail('notes', e.target.value)} rows={2} placeholder="Any special instructions…" className={TEXTAREA} />
              </Field>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && sender && receiver && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Step 4 — Review & Confirm</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sender</p>
                  <p className="mt-1 font-semibold text-slate-900">{sender.first_name} {sender.last_name}</p>
                  <p className="text-sm text-slate-600">{sender.phone}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Receiver</p>
                  <p className="mt-1 font-semibold text-slate-900">{receiver.first_name} {receiver.last_name}</p>
                  <p className="text-sm text-slate-600">{receiver.phone}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-50">
                {[
                  ['Weight', `${details.weight} kg`],
                  ['Dimensions', details.dimensions || '—'],
                  ['Declared Value', details.declaredValue ? `$${details.declaredValue}` : '—'],
                  ['Insurance', details.insuranceAmount ? `$${details.insuranceAmount}` : '—'],
                  ['Delivery Type', details.deliveryType.replace(/_/g, ' ')],
                  ['Payment', details.paymentMethod],
                  ['Fragile', details.fragile ? 'Yes ⚠️' : 'No'],
                  ['Signature', details.requiresSignature ? 'Required ✍️' : 'Not required'],
                  details.deliveryCharge ? ['Delivery Charge', `$${details.deliveryCharge}`] : null,
                  details.pickupDescription  ? ['Pickup From',  details.pickupDescription]  : null,
                  details.deliveryDescription ? ['Deliver To',  details.deliveryDescription] : null,
                  details.notes ? ['Notes', details.notes] : null,
                ].filter(Boolean).map(([label, value]: any) => (
                  <div key={label} className="flex items-start justify-between px-4 py-2.5 text-sm gap-4">
                    <span className="text-slate-500 shrink-0">{label}</span>
                    <span className="font-medium capitalize text-slate-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={handleNext} className="flex-1 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={createParcel.isPending} className="flex-1 rounded-2xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
              {createParcel.isPending ? 'Creating Shipment…' : '✓ Create Shipment'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
