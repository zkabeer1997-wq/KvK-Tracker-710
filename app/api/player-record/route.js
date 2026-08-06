import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

const MAX_TEXT_LENGTH = 100;
function text(value) { return String(value || '').trim().slice(0, MAX_TEXT_LENGTH); }
function list(value) { return Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, 30) : []; }

export async function GET(request) {
  const memberId = text(new URL(request.url).searchParams.get('member_id'));
  if (!memberId) return NextResponse.json({ error: 'Member ID is required.' }, { status: 400 });
  try {
    const { data, error } = await createAdminSupabaseClient().from('submissions')
      .select('name,member_id,infantry_tier,infantry_tg,cavalry_tier,cavalry_tg,archer_tier,archer_tg,heroes,availability,current_alliance')
      .eq('member_id', memberId).maybeSingle();
    if (error) return NextResponse.json({ error: 'Unable to load player record.' }, { status: 500 });
    return NextResponse.json({ record: data || null });
  } catch { return NextResponse.json({ error: 'Unable to load player record.' }, { status: 500 }); }
}

export async function POST(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const body = await request.json();
    const payload = {
      name: text(body.name), member_id: text(body.member_id), pin: text(body.pin),
      infantry_tier: text(body.infantry_tier) || null, infantry_tg: text(body.infantry_tg) || null,
      cavalry_tier: text(body.cavalry_tier) || null, cavalry_tg: text(body.cavalry_tg) || null,
      archer_tier: text(body.archer_tier) || null, archer_tg: text(body.archer_tg) || null,
      heroes: list(body.heroes), availability: text(body.availability) || null, current_alliance: text(body.current_alliance) || null,
    };
    if (!payload.name || !payload.member_id || !payload.pin) return NextResponse.json({ error: 'Name, Member ID, and PIN are required.' }, { status: 400 });
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc('submit_troop_form', {
      p_name: payload.name, p_member_id: payload.member_id, p_infantry_tier: payload.infantry_tier, p_infantry_tg: payload.infantry_tg,
      p_cavalry_tier: payload.cavalry_tier, p_cavalry_tg: payload.cavalry_tg, p_archer_tier: payload.archer_tier, p_archer_tg: payload.archer_tg,
      p_heroes: payload.heroes, p_availability: payload.availability, p_pin: payload.pin,
    });
    if (error) return NextResponse.json({ error: 'Unable to save player record.' }, { status: 500 });
    if (payload.current_alliance) await supabase.from('submissions').update({ current_alliance: payload.current_alliance }).eq('member_id', payload.member_id);
    return NextResponse.json({ status: data });
  } catch { return NextResponse.json({ error: 'Invalid player record.' }, { status: 400 }); }
}
