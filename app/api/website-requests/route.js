import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import { readMemberSession } from '../../../lib/memberAuth';

const SECTIONS = ['Tools and Calculators', 'Forms', 'Events', 'Guides', 'General'];
const MAX_MESSAGE_LENGTH = 2000;

// GET pre-fills the identity block (name, member ID, alliance) from the
// member's own submissions row, the same canonical registry every other
// member form reads from - no PIN needed, the session cookie is enough to
// read your own name back.
export async function GET(request) {
  const session = await readMemberSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  try {
    const { data, error } = await createAdminSupabaseClient()
      .from('submissions')
      .select('name,member_id,current_alliance')
      .eq('member_id', session.memberId)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({
      profile: data || { name: '', member_id: session.memberId, current_alliance: '' },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load your profile. Please try again.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await readMemberSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const section = String(body?.section || '').trim();
  const message = String(body?.message || '').trim();
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: 'Select a section for your request.' }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Enter your suggestion (up to ${MAX_MESSAGE_LENGTH} characters).` }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    // Never trust a client-supplied name/alliance - re-derive both from the
    // signed-in member's own registry row, same as the identity fields they
    // were shown read-only in the form.
    const { data: profile, error: profileError } = await supabase
      .from('submissions')
      .select('name,current_alliance')
      .eq('member_id', session.memberId)
      .maybeSingle();
    if (profileError) throw profileError;
    const { data, error } = await supabase
      .from('website_requests')
      .insert({
        member_id: session.memberId,
        name: profile?.name || session.memberId,
        current_alliance: profile?.current_alliance || null,
        section,
        message,
      })
      .select('id,member_id,name,current_alliance,section,message,status,created_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ row: data });
  } catch {
    return NextResponse.json({ error: 'Could not submit your request. Please try again.' }, { status: 500 });
  }
}
