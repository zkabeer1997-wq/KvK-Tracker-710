import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kingdom_guides')
      .select('slug, title, category, description, position, updated_at')
      .eq('is_published', true)
      .order('position', { ascending: true })
      .order('title', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ guides: data || [] });
  } catch (error) {
    console.error('guides directory GET failed', error);
    return NextResponse.json({ error: 'Unable to load guides.' }, { status: 500 });
  }
}
