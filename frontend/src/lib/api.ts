// Data layer — all queries go through the Supabase JS client.
// The axios client is kept only for local dev against the Express server.
export { supabase } from './supabase';
export { supabase as default } from './supabase';

// Compatibility shim: pages that still call setToken() won't break.
export const setToken = (_token: string) => {};
