import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import { readMemberSession } from '../../../lib/memberAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request) {
  const session = await readMemberSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Member login required.' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kingdom_guides')
      .select('slug, title, category, description, position, updated_at')
      .eq('is_published', true)
      .order('position', { ascending: true })
      .order('title', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ guides: data || [] }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('guides directory GET failed', error);
    return NextResponse.json({ error: 'Unable to load guides.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
