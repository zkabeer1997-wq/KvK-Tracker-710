import { NextResponse } from 'next/server';
import { isAdminRequest, isSameOriginRequest } from '../../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../../lib/adminSupabase';

export async function PATCH(request, { params }) {
  if (!(await isAdminRequest(request)) || !isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const updates = {};
    if (body.content !== undefined) updates.content = body.content;
    if (body.position !== undefined) updates.position = body.position;
    updates.updated_at = new Date().toISOString();
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
    .from('content_blocks')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ block: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!(await isAdminRequest(request)) || !isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
    .from('content_blocks')
    .delete()
    .eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
