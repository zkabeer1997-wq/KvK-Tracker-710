import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

async function requireAdmin(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  return null;
}

export async function GET(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('kingdom_guides')
    .select('slug, title, category, description, body, position, is_published, created_at, updated_at')
    .order('position', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('admin guides GET failed', error);
    return NextResponse.json({ error: 'Unable to load guides.' }, { status: 500 });
  }

  return NextResponse.json(
    { guides: data || [] },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function POST(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const slug = String(payload?.slug || '').trim();
  const title = String(payload?.title || '').trim();
  const category = String(payload?.category || '').trim();
  const description = String(payload?.description || '').trim();
  const body = typeof payload?.body === 'string' ? payload.body : '';
  const position = Number(payload?.position);

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Slug must use lowercase letters, numbers, and hyphens only.' }, { status: 400 });
  }
  if (!title || title.length > 180) {
    return NextResponse.json({ error: 'Title is required and must be 180 characters or fewer.' }, { status: 400 });
  }
  if (!category || category.length > 80) {
    return NextResponse.json({ error: 'Category is required and must be 80 characters or fewer.' }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: 'Description must be 500 characters or fewer.' }, { status: 400 });
  }
  if (body.length > 120000) {
    return NextResponse.json({ error: 'Guide text is too long.' }, { status: 413 });
  }
  if (!Number.isInteger(position) || position < 0 || position > 100000) {
    return NextResponse.json({ error: 'Position must be a whole number between 0 and 100000.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('kingdom_guides')
    .insert({
      slug,
      title,
      category,
      description,
      body,
      position,
      is_published: Boolean(payload?.is_published),
      updated_at: now,
    })
    .select('slug, title, category, description, body, position, is_published, created_at, updated_at')
    .single();

  if (error) {
    console.error('admin guide POST failed', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A guide with that slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to create guide.' }, { status: 500 });
  }

  revalidatePath('/guides');
  revalidatePath(`/guides/${slug}`);

  return NextResponse.json({ guide: data }, { status: 201 });
}
