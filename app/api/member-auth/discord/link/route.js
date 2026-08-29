import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { readMemberSession } from '../../../../../lib/memberAuth';
import { DISCORD_PENDING_COOKIE, readDiscordPayload } from '../../../../../lib/discordMemberAuth';

export async function POST(request) {
  const session = await readMemberSession(request);
  const pendingRaw = request.cookies.get(DISCORD_PENDING_COOKIE)?.value || '';
  const pending = await readDiscordPayload(pendingRaw);
  if (!session?.memberId || !pending?.discordUserId) {
    return NextResponse.json({ error: 'Discord link session expired. Start Discord verification again.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('member_auth_identities').upsert({
      provider: 'discord',
      provider_user_id: pending.discordUserId,
      member_id: session.memberId,
      provider_label: pending.discordUsername || null,
      metadata: { discord_username: pending.discordUsername || null },
      last_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider,provider_user_id' });
    if (error) throw error;

    const response = NextResponse.json({ ok: true, memberId: session.memberId, next: pending.next || '/player-record' });
    response.cookies.set(DISCORD_PENDING_COOKIE, '', { path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    console.error('discord identity link failed', error);
    return NextResponse.json({ error: 'Unable to link Discord to this member account.' }, { status: 500 });
  }
}
