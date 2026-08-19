import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { readMemberSession } from '../../../../lib/memberAuth';

function validToolKey(tool) {
  return typeof tool === 'string' && /^[a-z0-9-]{1,64}$/.test(tool);
}

export async function GET(request, { params }) {
  const session = await readMemberSession(request);
  if (!session) return NextResponse.json({ error: 'Member login required.' }, { status: 401 });

  const tool = params?.tool;
  if (!validToolKey(tool)) return NextResponse.json({ error: 'Invalid tool.' }, { status: 400 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('member_tool_state')
      .select('state, updated_at')
      .eq('member_id', session.memberId)
      .eq('tool_key', tool)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ state: data?.state || null, updatedAt: data?.updated_at || null });
  } catch (error) {
    console.error('tool-state GET failed', error);
    return NextResponse.json({ error: 'Unable to load saved tool inputs.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = await readMemberSession(request);
  if (!session) return NextResponse.json({ error: 'Member login required.' }, { status: 401 });

  const tool = params?.tool;
  if (!validToolKey(tool)) return NextResponse.json({ error: 'Invalid tool.' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const state = body?.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return NextResponse.json({ error: 'Invalid tool state.' }, { status: 400 });
  }
  if (JSON.stringify(state).length > 50000) {
    return NextResponse.json({ error: 'Saved tool state is too large.' }, { status: 413 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('member_tool_state').upsert({
      member_id: session.memberId,
      tool_key: tool,
      state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id,tool_key' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('tool-state PUT failed', error);
    return NextResponse.json({ error: 'Unable to save tool inputs.' }, { status: 500 });
  }
}
