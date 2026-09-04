import { createClient } from '@supabase/supabase-js';

let client;

function getSupabaseClient() {
 if (client) return client;

 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

 if (!supabaseUrl || !supabaseAnonKey) {
 throw new Error('Supabase public credentials are not configured.');
 }

 client = createClient(supabaseUrl, supabaseAnonKey);
 return client;
}

export const supabase = new Proxy({}, {
 get(_target, prop) {
 return getSupabaseClient()[prop];
 },
});
