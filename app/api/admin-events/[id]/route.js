import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../../lib/adminSupabase';

const KINDS = ['kvk', 'championship', 'swordland', 'custom'];
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

async function requireAdmin(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function PUT(request, { params }) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'Missing event id.' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const update = {};
  if (body.slug !== undefined) {
    const slug = String(body.slug).trim();
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only.' }, { status: 400 });
    }
    update.slug = slug;
  }
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    update.title = title;
  }
  if (body.kind !== undefined) {
    if (!KINDS.includes(body.kind)) {
      return NextResponse.json({ error: 'Unsupported event kind.' }, { status: 400 });
    }
    update.kind = body.kind;
  }
  if (body.description !== undefined) update.description = String(body.description);
  if (body.body_md !== undefined) update.body_md = String(body.body_md);
  if (body.starts_at !== undefined) {
    if (!body.starts_at || Number.isNaN(new Date(body.starts_at).getTime())) {
      return NextResponse.json({ error: 'A valid start date/time is required.' }, { status: 400 });
    }
    update.starts_at = new Date(body.starts_at).toISOString();
  }
  if (body.ends_at !== undefined) {
    update.ends_at = body.ends_at && !Number.isNaN(new Date(body.ends_at).getTime()) ? new Date(body.ends_at).toISOString() : null;
  }
  if (body.published !== undefined) update.published = Boolean(body.published);
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/events');
  revalidatePath(`/events/${existing.slug}`);
  if (update.slug && update.slug !== existing.slug) revalidatePath(`/events/${update.slug}`);

  return NextResponse.json({ event: data });
}

export async function DELETE(request, { params }) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'Missing event id.' }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data: existing } = await supabase.from('events').select('slug').eq('id', id).maybeSingle();

  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/events');
  if (existing?.slug) revalidatePath(`/events/${existing.slug}`);

  return NextResponse.json({ ok: true });
}
