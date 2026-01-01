import { createClient } from '@supabase/supabase-js';

let supabase = null;
export function createSupabaseServerClient() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY; // service role key (server-side only)
  if (!url || !key) throw new Error('Supabase env not configured');
  supabase = createClient(url, key);
  return supabase;
}
