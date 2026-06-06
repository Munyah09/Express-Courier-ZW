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

// Seed the default Zimbabwe routes — idempotent, skips existing names
router.post('/seed-defaults', authenticateJwt, async (_req, res) => {
  const DEFAULT_ROUTES = [
    // ── Harare → Zvishavane (Masvingo Road) ──
    { name: 'Harare → Zvishavane (Via Masvingo)', origin: 'Harare', destination: 'Zvishavane', notes: 'Masvingo Road: Beatrice · Ngezi Turnoff · Furtherstone · Chivhu · Mvuma · Chaka · Masvingo · Mashava · Mhandamabwe · Zvishavane' },
    { name: 'Zvishavane → Harare (Via Masvingo)', origin: 'Zvishavane', destination: 'Harare', notes: 'Masvingo Road (reverse): Mhandamabwe · Mashava · Masvingo · Chaka · Mvuma · Chivhu · Furtherstone · Ngezi Turnoff · Beatrice · Harare' },
    // ── Harare → Zvishavane (Bulawayo Road) ──
    { name: 'Harare → Zvishavane (Via Gweru)', origin: 'Harare', destination: 'Zvishavane', notes: 'Bulawayo Road: Whitehouse · Norton · Halfway/Selous · Kadoma · Kwekwe · Gweru · Shurugwi · Shangani · Siboza · Zvishavane' },
    { name: 'Zvishavane → Harare (Via Gweru)', origin: 'Zvishavane', destination: 'Harare', notes: 'Bulawayo Road (reverse): Siboza · Shangani · Shurugwi · Gweru · Kwekwe · Kadoma · Halfway/Selous · Norton · Whitehouse · Harare' },
    // ── Harare → Bulawayo ──
    { name: 'Harare → Bulawayo', origin: 'Harare', destination: 'Bulawayo', notes: 'Midlands: Whitehouse · Norton · Kadoma · Kwekwe · Gweru · Shangani · Bulawayo' },
    { name: 'Bulawayo → Harare', origin: 'Bulawayo', destination: 'Harare', notes: 'Midlands (reverse): Shangani · Gweru · Kwekwe · Kadoma · Norton · Whitehouse · Harare' },
    // ── Harare → Mutare ──
    { name: 'Harare → Mutare', origin: 'Harare', destination: 'Mutare', notes: 'Eastern Highlands: Marondera · Rusape · Mutare' },
    { name: 'Mutare → Harare', origin: 'Mutare', destination: 'Harare', notes: 'Eastern Highlands (reverse): Rusape · Marondera · Harare' },
    // ── Harare → Masvingo ──
    { name: 'Harare → Masvingo', origin: 'Harare', destination: 'Masvingo', notes: 'Great Zimbabwe Road: Beatrice · Chivhu · Mvuma · Masvingo' },
    { name: 'Masvingo → Harare', origin: 'Masvingo', destination: 'Harare', notes: 'Great Zimbabwe Road (reverse): Mvuma · Chivhu · Beatrice · Harare' },
    // ── Harare → Beitbridge ──
    { name: 'Harare → Beitbridge', origin: 'Harare', destination: 'Beitbridge', notes: 'Southern route: Masvingo · Ngundu · Bubi · Rutenga · Beitbridge' },
    { name: 'Beitbridge → Harare', origin: 'Beitbridge', destination: 'Harare', notes: 'Southern route (reverse): Rutenga · Bubi · Ngundu · Masvingo · Harare' },
    // ── Harare → Victoria Falls ──
    { name: 'Harare → Victoria Falls', origin: 'Harare', destination: 'Victoria Falls', notes: 'Western route: Kadoma · Kwekwe · Gweru · Bulawayo · Hwange · Victoria Falls' },
    { name: 'Victoria Falls → Harare', origin: 'Victoria Falls', destination: 'Harare', notes: 'Western route (reverse): Hwange · Bulawayo · Gweru · Kwekwe · Kadoma · Harare' },
    // ── Harare → Kariba ──
    { name: 'Harare → Kariba', origin: 'Harare', destination: 'Kariba', notes: 'North: Chinhoyi · Karoi · Makuti · Siakobvu · Kariba' },
    { name: 'Kariba → Harare', origin: 'Kariba', destination: 'Harare', notes: 'North (reverse): Siakobvu · Makuti · Karoi · Chinhoyi · Harare' },
    // ── Harare → Gweru ──
    { name: 'Harare → Gweru', origin: 'Harare', destination: 'Gweru', notes: 'Norton · Chegutu · Kadoma · Kwekwe · Gweru' },
    { name: 'Gweru → Harare', origin: 'Gweru', destination: 'Harare', notes: 'Kwekwe · Kadoma · Chegutu · Norton · Harare' },
    // ── Harare → Kadoma ──
    { name: 'Harare → Kadoma', origin: 'Harare', destination: 'Kadoma', notes: 'Norton · Chegutu · Kadoma' },
    { name: 'Kadoma → Harare', origin: 'Kadoma', destination: 'Harare', notes: 'Chegutu · Norton · Harare' },
    // ── Harare → Kwekwe ──
    { name: 'Harare → Kwekwe', origin: 'Harare', destination: 'Kwekwe', notes: 'Norton · Kadoma · Kwekwe' },
    { name: 'Kwekwe → Harare', origin: 'Kwekwe', destination: 'Harare', notes: 'Kadoma · Norton · Harare' },
    // ── Bulawayo → Beitbridge ──
    { name: 'Bulawayo → Beitbridge', origin: 'Bulawayo', destination: 'Beitbridge', notes: 'Gwanda · West Nicholson · Beitbridge' },
    { name: 'Beitbridge → Bulawayo', origin: 'Beitbridge', destination: 'Bulawayo', notes: 'West Nicholson · Gwanda · Bulawayo' },
    // ── Bulawayo → Victoria Falls ──
    { name: 'Bulawayo → Victoria Falls', origin: 'Bulawayo', destination: 'Victoria Falls', notes: 'Hwange · Deka · Victoria Falls' },
    { name: 'Victoria Falls → Bulawayo', origin: 'Victoria Falls', destination: 'Bulawayo', notes: 'Deka · Hwange · Bulawayo' },
    // ── Mutare → Chipinge ──
    { name: 'Mutare → Chipinge', origin: 'Mutare', destination: 'Chipinge', notes: 'Wengezi · Skyline Junction · Chipinge' },
    { name: 'Chipinge → Mutare', origin: 'Chipinge', destination: 'Mutare', notes: 'Skyline Junction · Wengezi · Mutare' },
    // ── Masvingo → Beitbridge ──
    { name: 'Masvingo → Beitbridge', origin: 'Masvingo', destination: 'Beitbridge', notes: 'Ngundu · Bubi · Rutenga · Beitbridge' },
    { name: 'Beitbridge → Masvingo', origin: 'Beitbridge', destination: 'Masvingo', notes: 'Rutenga · Bubi · Ngundu · Masvingo' },
    // ── Harare local ──
    { name: 'Harare → Chinhoyi', origin: 'Harare', destination: 'Chinhoyi', notes: 'Norton · Chinhoyi (Caves Road)' },
    { name: 'Harare → Marondera', origin: 'Harare', destination: 'Marondera', notes: 'Ruwa · Marondera' },
    { name: 'Harare → Bindura', origin: 'Harare', destination: 'Bindura', notes: 'Mazowe · Bindura' },
  ];

  try {
    const { data: existing } = await db.from('routes').select('name');
    const existingNames = new Set((existing ?? []).map((r: any) => r.name));

    let created = 0;
    const errors: string[] = [];

    for (const route of DEFAULT_ROUTES) {
      if (existingNames.has(route.name)) continue;
      const { error } = await db.from('routes').insert({ ...route, status: 'active' });
      if (error) errors.push(`${route.name}: ${error.message}`);
      else created++;
    }

    res.json({ data: { created, skipped: DEFAULT_ROUTES.length - created - errors.length, errors } });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || String(error) });
  }
});

export default router;
