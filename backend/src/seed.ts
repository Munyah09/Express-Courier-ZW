#!/usr/bin/env node
/**
 * Seed script — creates roles, permissions, and demo users.
 * Run: npx ts-node --transpile-only src/seed.ts
 */

import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env BEFORE creating any clients
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const rawKey = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_KEY = rawKey.startsWith('eyJ')
  ? rawKey
  : process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

console.log(`🔑 Using key: ${SUPABASE_KEY.substring(0, 30)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SALT_ROUNDS = 12;

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = [
  { name: 'super_admin',      description: 'Master account — full system access' },
  { name: 'admin',            description: 'Operations manager' },
  { name: 'franchise_owner',  description: 'Franchise territory owner' },
  { name: 'branch_manager',   description: 'Branch-level manager' },
  { name: 'shop_assistant',   description: 'Collection point operator' },
  { name: 'driver',           description: 'Parcel transporter' },
  { name: 'clerk',            description: 'Logistics clerk' },
  { name: 'accountant',       description: 'Financial controller' },
  { name: 'logistics_manager',description: 'Route and fleet manager' },
  { name: 'customer',         description: 'End customer' },
];

// ── Permissions ───────────────────────────────────────────────────────────────
const PERMISSIONS = [
  'create_shipment',
  'scan_parcel',
  'verify_otp',
  'approve_manifest',
  'view_finances',
  'manage_users',
  'manage_franchise',
  'assign_driver',
  'generate_report',
  'manage_collection_point',
];

// ── Demo users ─────────────────────────────────────────────────────────────────
interface DemoUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
}

const DEMO_USERS: DemoUser[] = [
  // ── Super Admin (required) ──
  {
    email:      'hello@munya.co.zw',
    password:   'griezmann17',
    first_name: 'Munyaradzi',
    last_name:  'Muzvidziwa',
    phone:      '+263771000001',
    role:       'super_admin',
  },
  // ── Admin ──
  {
    email:      'admin@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Admin',
    last_name:  'Mufasa',
    phone:      '+263771000002',
    role:       'admin',
  },
  // ── Franchise Owner ──
  {
    email:      'franchise@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Franchise',
    last_name:  'Owner',
    phone:      '+263771000003',
    role:       'franchise_owner',
  },
  // ── Branch Manager ──
  {
    email:      'manager@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Branch',
    last_name:  'Manager',
    phone:      '+263771000004',
    role:       'branch_manager',
  },
  // ── Driver ──
  {
    email:      'driver@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Tendai',
    last_name:  'Driver',
    phone:      '+263771000005',
    role:       'driver',
  },
  // ── Shop Assistant / Agent ──
  {
    email:      'agent@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Chido',
    last_name:  'Agent',
    phone:      '+263771000006',
    role:       'shop_assistant',
  },
  // ── Clerk ──
  {
    email:      'clerk@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Rudo',
    last_name:  'Clerk',
    phone:      '+263771000007',
    role:       'clerk',
  },
  // ── Accountant ──
  {
    email:      'accounts@mufasa.co.zw',
    password:   'Demo@1234',
    first_name: 'Finance',
    last_name:  'Controller',
    phone:      '+263771000008',
    role:       'accountant',
  },
];

async function upsertRoles(): Promise<Record<string, string>> {
  console.log('\n📋 Upserting roles...');
  for (const role of ROLES) {
    const { error } = await supabase
      .from('roles')
      .upsert({ name: role.name, description: role.description }, { onConflict: 'name' });
    if (error) console.error(`  ✗ ${role.name}:`, error.message);
    else console.log(`  ✓ ${role.name}`);
  }

  const { data } = await supabase.from('roles').select('id, name');
  return Object.fromEntries((data ?? []).map((r: any) => [r.name, r.id]));
}

async function upsertPermissions() {
  console.log('\n🔐 Upserting permissions...');
  for (const perm of PERMISSIONS) {
    const { error } = await supabase
      .from('permissions')
      .upsert({ name: perm, description: `Permission: ${perm}` }, { onConflict: 'name' });
    if (error) console.error(`  ✗ ${perm}:`, error.message);
    else console.log(`  ✓ ${perm}`);
  }
}

async function upsertUsers(roleMap: Record<string, string>) {
  console.log('\n👤 Upserting demo users...');
  for (const u of DEMO_USERS) {
    const roleId = roleMap[u.role];
    if (!roleId) {
      console.error(`  ✗ ${u.email}: role "${u.role}" not found`);
      continue;
    }

    const password_hash = await bcrypt.hash(u.password, SALT_ROUNDS);

    const { error } = await supabase.from('users').upsert(
      {
        email:         u.email,
        password_hash,
        first_name:    u.first_name,
        last_name:     u.last_name,
        phone:         u.phone,
        role_id:       roleId,
        is_active:     true,
      },
      { onConflict: 'email' }
    );

    if (error) console.error(`  ✗ ${u.email}:`, error.message);
    else console.log(`  ✓ ${u.email}  [${u.role}]`);
  }
}

async function main() {
  console.log('🦁 Mufasa Express — Database Seeder\n' + '─'.repeat(45));

  const roleMap = await upsertRoles();
  await upsertPermissions();
  await upsertUsers(roleMap);

  console.log('\n' + '─'.repeat(45));
  console.log('✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('─'.repeat(45));
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(18)} ${u.email.padEnd(28)} ${u.password}`);
  }
  console.log('─'.repeat(45));
}

main().catch((e) => { console.error(e); process.exit(1); });
