import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchCustomers, useCreateCustomer, useCreateParcel } from '../hooks/useQueries';
import { useToast } from '../components/Toast';

// ── Types ─────────────────────────────────────────────────────
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
  deliveryType: 'home' | 'collection_point' | 'intercity';
  paymentMethod: 'cash' | 'ecocash' | 'swipe' | 'zipit' | 'account';
  deliveryCharge: string;        // customizable delivery cost
  deliveryZone: string;          // e.g. "Avenues, Harare" or "Nkulumane 7, Bulawayo"
  pickupLandmark: string;        // e.g. "Shell Msasa, opposite OK Food Mart"
  deliveryLandmark: string;      // e.g. "Green roof house, next to Bon Marche Gwanda"
  notes: string;
  fragile: boolean;
  requiresSignature: boolean;
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
    } catch {
      notify('Failed to create customer', 'error');
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

      {/* Search */}
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

      {/* Results */}
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

      {/* Add new customer */}
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
            <input
              placeholder="First name *"
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer(p => ({ ...p, firstName: e.target.value }))}
              className="col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <input
              placeholder="Last name"
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer(p => ({ ...p, lastName: e.target.value }))}
              className="col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <input
            placeholder="Phone *"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <input
            placeholder="WhatsApp (if different)"
            value={newCustomer.whatsapp}
            onChange={(e) => setNewCustomer(p => ({ ...p, whatsapp: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <input
            placeholder="Email (optional)"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <input
            placeholder="Landmark / delivery address"
            value={newCustomer.landmarkAddress}
            onChange={(e) => setNewCustomer(p => ({ ...p, landmarkAddress: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <select
            value={newCustomer.customerType}
            onChange={(e) => setNewCustomer(p => ({ ...p, customerType: e.target.value as any }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={createCustomer.isPending}
              className="flex-1 rounded-xl bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {createCustomer.isPending ? 'Saving…' : 'Save & Select'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field component ───────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="mb-1 text-xs text-slate-400">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

// ── Step indicator ────────────────────────────────────────────
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
            <span className={`hidden text-xs font-medium sm:block ${active ? 'text-brand-700' : 'text-slate-400'}`}>{label}</span>
            {i < steps.length - 1 && <div className={`mx-1 h-px w-4 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
const DEFAULT_DETAILS: ParcelDetails = {
  weight: '',
  dimensions: '',
  declaredValue: '',
  insuranceAmount: '',
  deliveryType: 'home',
  paymentMethod: 'cash',
  deliveryCharge: '',
  deliveryZone: '',
  pickupLandmark: '',
  deliveryLandmark: '',
  notes: '',
  fragile: false,
  requiresSignature: false,
};

export function CreateParcelPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const createParcel = useCreateParcel();

  const [step, setStep] = useState(1);
  const [sender, setSender] = useState<Customer | null>(null);
  const [receiver, setReceiver] = useState<Customer | null>(null);
  const [details, setDetails] = useState<ParcelDetails>(DEFAULT_DETAILS);

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
        senderId:         sender.id,
        receiverId:       receiver.id,
        weight:           Number(details.weight),
        dimensions:       details.dimensions       || undefined,
        declaredValue:    details.declaredValue    ? Number(details.declaredValue)    : undefined,
        insuranceAmount:  details.insuranceAmount  ? Number(details.insuranceAmount)  : undefined,
        deliveryCharge:   details.deliveryCharge   ? Number(details.deliveryCharge)   : undefined,
        deliveryType:     details.deliveryType,
        paymentMethod:    details.paymentMethod,
        deliveryZone:     details.deliveryZone     || undefined,
        pickupLandmark:   details.pickupLandmark   || undefined,
        deliveryLandmark: details.deliveryLandmark || undefined,
        notes:            details.notes            || undefined,
        fragile:          details.fragile,
        requiresSignature: details.requiresSignature,
      });
      notify(`Shipment created — ${parcel.tracking_number}`, 'success');
      navigate(`/parcels/${parcel.id}`);
    } catch (err: any) {
      notify(err?.response?.data?.error || 'Failed to create shipment', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Step 3 — Parcel Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight (kg) *">
                <input
                  type="number" step="0.1" min="0.1"
                  value={details.weight}
                  onChange={(e) => setDetail('weight', e.target.value)}
                  placeholder="e.g. 2.5"
                  className={INPUT}
                />
              </Field>
              <Field label="Dimensions (L×W×H cm)">
                <input
                  type="text"
                  value={details.dimensions}
                  onChange={(e) => setDetail('dimensions', e.target.value)}
                  placeholder="e.g. 30×20×15"
                  className={INPUT}
                />
              </Field>
              <Field label="Declared Value (USD)">
                <input
                  type="number" step="0.01" min="0"
                  value={details.declaredValue}
                  onChange={(e) => setDetail('declaredValue', e.target.value)}
                  placeholder="0.00"
                  className={INPUT}
                />
              </Field>
              <Field label="Insurance Amount (USD)">
                <input
                  type="number" step="0.01" min="0"
                  value={details.insuranceAmount}
                  onChange={(e) => setDetail('insuranceAmount', e.target.value)}
                  placeholder="0.00"
                  className={INPUT}
                />
              </Field>
            </div>

            <Field label="Delivery Type">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'home', label: 'Home Delivery', icon: '🏠' },
                  { v: 'collection_point', label: 'Collection Point', icon: '📍' },
                  { v: 'intercity', label: 'Intercity', icon: '🚚' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setDetail('deliveryType', opt.v)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-medium transition-all ${details.deliveryType === opt.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Zimbabwe Landmark fields — priority section */}
            <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-sm font-bold text-brand-800">Zimbabwe Delivery Locations</p>
                  <p className="text-xs text-brand-600">Use local names — areas, landmarks, shops — not formal addresses</p>
                </div>
              </div>
              <Field label="Pickup Landmark / Drop-off Point" hint="e.g. Shell Msasa, opposite OK Food · Chicken Inn Kwekwe Town Centre · Sender's shop in Mbare Musika">
                <input
                  type="text"
                  value={details.pickupLandmark}
                  onChange={(e) => setDetail('pickupLandmark', e.target.value)}
                  placeholder="Where to collect from — local name"
                  className={INPUT}
                />
              </Field>
              <Field label="Delivery Area / Zone" hint="e.g. Avenues Harare · Nkulumane 7 Bulawayo · Sakubva Mutare · Mkoba 14 Gweru">
                <input
                  type="text"
                  value={details.deliveryZone}
                  onChange={(e) => setDetail('deliveryZone', e.target.value)}
                  placeholder="Area or neighbourhood name"
                  className={INPUT}
                />
              </Field>
              <Field label="Delivery Landmark / Exact Spot" hint="e.g. Green roof house next to Bon Marche · Blue gate after the school · Flat 3B Marimba Flats">
                <input
                  type="text"
                  value={details.deliveryLandmark}
                  onChange={(e) => setDetail('deliveryLandmark', e.target.value)}
                  placeholder="How driver finds the exact spot"
                  className={INPUT}
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

            <Field label="Delivery Charge (USD)" hint="Override the calculated rate if needed — e.g. home delivery to remote area, special arrangement">
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
                Leave blank to use standard rate ·
                <button type="button" onClick={() => window.open('/pricing', '_blank')} className="ml-1 text-brand-600 underline">Check rate calculator</button>
              </p>
            </Field>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={details.fragile}
                  onChange={(e) => setDetail('fragile', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand-500"
                />
                <span className="text-sm font-medium text-slate-700">⚠️ Fragile</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={details.requiresSignature}
                  onChange={(e) => setDetail('requiresSignature', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand-500"
                />
                <span className="text-sm font-medium text-slate-700">✍️ Signature Required</span>
              </label>
            </div>

            <Field label="Notes (optional)">
              <textarea
                value={details.notes}
                onChange={(e) => setDetail('notes', e.target.value)}
                rows={3}
                placeholder="Any special instructions…"
                className={`${INPUT} resize-none`}
              />
            </Field>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && sender && receiver && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Step 4 — Review & Confirm</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Sender */}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sender</p>
                <p className="mt-1 font-semibold text-slate-900">{sender.first_name} {sender.last_name}</p>
                <p className="text-sm text-slate-600">{sender.phone}</p>
                {sender.landmark_address && <p className="text-xs text-slate-500">{sender.landmark_address}</p>}
              </div>
              {/* Receiver */}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Receiver</p>
                <p className="mt-1 font-semibold text-slate-900">{receiver.first_name} {receiver.last_name}</p>
                <p className="text-sm text-slate-600">{receiver.phone}</p>
                {receiver.landmark_address && <p className="text-xs text-slate-500">{receiver.landmark_address}</p>}
              </div>
            </div>

            {/* Parcel summary */}
            <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-50">
              {[
                ['Weight', `${details.weight} kg`],
                ['Dimensions', details.dimensions || '—'],
                ['Declared Value', details.declaredValue ? `$${details.declaredValue}` : '—'],
                ['Insurance', details.insuranceAmount ? `$${details.insuranceAmount}` : '—'],
                ['Delivery Type', details.deliveryType.replace('_', ' ')],
                ['Payment', details.paymentMethod],
                ['Fragile', details.fragile ? 'Yes ⚠️' : 'No'],
                ['Signature Required', details.requiresSignature ? 'Yes ✍️' : 'No'],
                ['Notes', details.notes || '—'],
                details.pickupLandmark   ? ['Pickup From',    details.pickupLandmark]  : null,
                details.deliveryZone     ? ['Delivery Area',  details.deliveryZone]    : null,
                details.deliveryLandmark ? ['Delivery Spot',  details.deliveryLandmark]: null,
                details.deliveryCharge   ? ['Delivery Charge',`$${details.deliveryCharge}`] : null,
              ].filter(Boolean).map(([label, value]: any) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium capitalize text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createParcel.isPending}
            className="flex-1 rounded-2xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {createParcel.isPending ? 'Creating Shipment…' : '✓ Create Shipment'}
          </button>
        )}
      </div>
    </div>
  );
}
