import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hhbfsyihyuajatxpivcp.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmZzeWloeXVhamF0eHBpdmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjY4NDAsImV4cCI6MjA5NTA5MDI4NDB9.vr6rupr6fFlkAi65dyt4sLRdZBoOq2Eqq2FNFMpCye8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
