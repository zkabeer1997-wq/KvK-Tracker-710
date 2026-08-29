import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { createMemberToken, MEMBER_COOKIE_NAME, MEMBER_TOKEN_TTL_MS } from '../../../../../lib/memberAuth';
import {
  DISCORD_PENDING_COOKIE,
  DISCORD_STATE_COOKIE,
  discordConfig,
  exchangeDiscordCode,
  fetchDiscordIdentity,
  readDiscordPayload,
  signDiscordPayload,
} from '../../../../../lib/discordMemberAuth';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const stateCookie = request.cookies.get(DISCORD_STATE_COOKIE)?.value || '';
  const parsedState = await readDiscordPayload(state);

  if (!code || !parsedState || state !== stateCookie) {
    return NextResponse.redirect(new URL('/player-record?auth_error=discord_state', request.url));
  }

  try {
    const { guildId } = discordConfig();
    const token = await exchangeDiscordCode(code);
    const { user, guilds } = await fetchDiscordIdentity(token.access_token);
    const isMember = guilds.some((guild) => String(guild.id) === String(guildId));
    if (!isMember) {
      return NextResponse.redirect(new URL('/player-record?auth_error=discord_guild', request.url));
    }

    const supabase = createSupabaseAdminClient();
    const { data: identity, error } = await supabase
      .from('member_auth_identities')
      .select('member_id')
      .eq('provider', 'discord')
      .eq('provider_user_id', String(user.id))
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;

    if (identity?.member_id) {
      const memberToken = await createMemberToken(identity.member_id);
      const response = NextResponse.redirect(new URL(parsedState.next || '/player-record', request.url));
      response.cookies.set(MEMBER_COOKIE_NAME, memberToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: MEMBER_TOKEN_TTL_MS / 1000,
      });
      response.cookies.set(DISCORD_STATE_COOKIE, '', { path: '/', maxAge: 0 });
      return response;
    }

    const pending = await signDiscordPayload({
      discordUserId: String(user.id),
      discordUsername: user.global_name || user.username || `Discord ${user.id}`,
      next: parsedState.next || '/player-record',
    }, 15 * 60 * 1000);

    const response = NextResponse.redirect(new URL('/player-record?auth=discord-link', request.url));
    response.cookies.set(DISCORD_PENDING_COOKIE, pending, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });
    response.cookies.set(DISCORD_STATE_COOKIE, '', { path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    console.error('discord auth callback failed', error);
    return NextResponse.redirect(new URL('/player-record?auth_error=discord_failed', request.url));
  }
}
