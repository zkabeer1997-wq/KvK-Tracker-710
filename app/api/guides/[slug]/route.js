import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../../lib/adminSupabase';

export const dynamic = 'force-dynamic';

function validSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{1,80}$/.test(slug);
}

export async function GET(request, { params }) {
  const slug = params?.slug;
  if (!validSlug(slug)) {
    return NextResponse.json({ error: 'Invalid guide.' }, { status: 400 });
  }

  try {
    const admin = await isAdminRequest(request);
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kingdom_guides')
      .select('slug, title, category, description, body, position, is_published, updated_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data || (!data.is_published && !admin)) {
      return NextResponse.json({ error: 'Guide not found.' }, { status: 404 });
    }

    return NextResponse.json({ guide: data, isAdmin: admin });
  } catch (error) {
    console.error('guide GET failed', error);
    return NextResponse.json({ error: 'Unable to load this guide.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  const slug = params?.slug;
  if (!validSlug(slug)) {
    return NextResponse.json({ error: 'Invalid guide.' }, { status: 400 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const body = payload?.body;
  if (typeof body !== 'string') {
    return NextResponse.json({ error: 'Guide text is required.' }, { status: 400 });
  }
  if (body.length > 120000) {
    return NextResponse.json({ error: 'Guide text is too long.' }, { status: 413 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kingdom_guides')
      .update({ body, updated_at: new Date().toISOString() })
      .eq('slug', slug)
      .select('slug, title, category, description, body, position, is_published, updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ guide: data });
  } catch (error) {
    console.error('guide PUT failed', error);
    return NextResponse.json({ error: 'Unable to save this guide.' }, { status: 500 });
  }
}
