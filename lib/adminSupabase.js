import { createClient } from '@supabase/supabase-js';

// Single factory for the service-role Supabase client, consolidated from
// the former lib/supabaseAdmin.js (see _archive_obsolete/). Cached as a
// module-level singleton per warm serverless instance: this is a REST/HTTP
// client with no connection to leak, so reusing it across calls in the
// same instance just skips redundant client construction.
let cachedClient = null;

export function createAdminSupabaseClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}
