import { cookies } from 'next/headers';
import { createAdminSupabaseClient } from './adminSupabase';
import { ADMIN_COOKIE_NAME, computeAdminToken } from './adminAuth';

export async function getBlocks(page) {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page', page)
    .order('position', { ascending: true });
    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function checkIsAdmin() {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!cookie) return false;
    const expected = await computeAdminToken();
    return Boolean(expected && cookie.value === expected);
  } catch (error) {
    return false;
  }
}
