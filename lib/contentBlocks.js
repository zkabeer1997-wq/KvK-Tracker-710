import { cookies } from 'next/headers';
import { createAdminSupabaseClient } from './adminSupabase';
import { hasAdminRole } from './adminAuth';
import { readMemberSession } from './memberAuth';

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
    const cookieStore = await cookies();
    const session = await readMemberSession({ cookies: cookieStore });
    return hasAdminRole(session?.role);
  } catch (error) {
    return false;
  }
}
