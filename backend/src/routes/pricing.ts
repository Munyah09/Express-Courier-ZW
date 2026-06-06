import { Router } from 'express';

const router = Router();

// Base rate matrix: [origin_type][destination_type] in USD
// 'local' = same city, 'regional' = nearby city, 'intercity' = far
const BASE_RATES: Record<string, Record<string, number>> = {
  local:     { local: 2.00, regional: 4.50, intercity: 7.00 },
  regional:  { local: 4.50, regional: 5.00, intercity: 8.50 },
  intercity: { local: 7.00, regional: 8.50, intercity: 10.00 },
};

const WEIGHT_BRACKETS = [
  { max: 1,   multiplier: 1.0 },
  { max: 5,   multiplier: 1.4 },
  { max: 10,  multiplier: 1.8 },
  { max: 25,  multiplier: 2.5 },
  { max: 50,  multiplier: 3.5 },
  { max: 999, multiplier: 5.0 },
];

const HARARE_HUB = ['Harare', 'Chitungwiza', 'Marondera', 'Bindura', 'Chinhoyi'];
const BULY_HUB   = ['Bulawayo', 'Gweru', 'Kwekwe', 'Zvishavane', 'Redcliff'];
const MUTARE_HUB = ['Mutare', 'Rusape', 'Chipinge', 'Chiredzi'];
const OTHERS     = ['Masvingo', 'Beitbridge', 'Kariba', 'Victoria Falls', 'Hwange', 'Plumtree', 'Kadoma'];

function getCityType(city: string, referenceCity: string): 'local' | 'regional' | 'intercity' {
  if (city === referenceCity) return 'local';
  const getHub = (c: string) => {
    if (HARARE_HUB.includes(c)) return 'harare';
    if (BULY_HUB.includes(c))   return 'buly';
    if (MUTARE_HUB.includes(c)) return 'mutare';
    return 'other';
  };
  return getHub(city) === getHub(referenceCity) ? 'regional' : 'intercity';
}

function getWeightMultiplier(weight: number): number {
  return WEIGHT_BRACKETS.find(b => weight <= b.max)?.multiplier ?? 5.0;
}

// Public endpoint — no auth needed
router.get('/calculate', (req, res) => {
  const { origin, destination, weight, deliveryType, insurance, fragile } = req.query as Record<string, string>;

  const w = parseFloat(weight) || 1;
  const ins = parseFloat(insurance) || 0;

  const originType = getCityType(origin ?? 'Harare', destination ?? 'Bulawayo');
  const destType   = getCityType(destination ?? 'Bulawayo', origin ?? 'Harare');
  const key = originType === 'local' ? 'local' : (originType === 'regional' ? 'regional' : 'intercity');
  const destKey = destType === 'local' ? 'local' : (destType === 'regional' ? 'regional' : 'intercity');

  let base = BASE_RATES[key][destKey];
  const weightMult = getWeightMultiplier(w);
  let subtotal = base * weightMult;

  // Delivery type surcharge
  if (deliveryType === 'home')          subtotal += 1.50;
  if (deliveryType === 'bike_delivery') subtotal = 3.00 * weightMult; // flat local rate

  // Fragile surcharge
  const fragileSurcharge = fragile === 'true' ? subtotal * 0.15 : 0;

  // Insurance
  const insuranceFee = ins > 0 ? ins * 0.02 : 0; // 2% of declared value

  const total = parseFloat((subtotal + fragileSurcharge + insuranceFee).toFixed(2));

  res.json({
    data: {
      origin: origin ?? 'Harare',
      destination: destination ?? 'Bulawayo',
      weight: w,
      breakdown: {
        baseRate: parseFloat(base.toFixed(2)),
        weightMultiplier: weightMult,
        subtotal: parseFloat(subtotal.toFixed(2)),
        fragileSurcharge: parseFloat(fragileSurcharge.toFixed(2)),
        insuranceFee: parseFloat(insuranceFee.toFixed(2)),
        total,
      },
      currency: 'USD',
    }
  });
});

// Get rate card
router.get('/rates', (_req, res) => {
  res.json({
    data: {
      weightBrackets: WEIGHT_BRACKETS,
      baseRates: BASE_RATES,
      surcharges: {
        homeDelivery: 1.50,
        fragile: '15% of subtotal',
        insurance: '2% of declared value',
      },
      currency: 'USD',
    }
  });
});

export default router;
