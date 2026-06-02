import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';

// Prefer service_role JWT (starts with eyJ). If the env only has an sbp_ PAT
// (a Management-API personal access token), fall back to the anon key so the
// JS client can still reach the database.
const rawKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseKey = rawKey.startsWith('eyJ')
  ? rawKey
  : process.env.SUPABASE_ANON_KEY || rawKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) must be set');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const db = {
  from: (table: string) => supabase.from(table),
  rpc: (name: string, params?: Record<string, unknown>) => supabase.rpc(name, params)
};
