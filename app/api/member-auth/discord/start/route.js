import { NextResponse } from 'next/server';
import { DISCORD_STATE_COOKIE, discordAuthorizeUrl, signDiscordPayload } from '../../../../../lib/discordMemberAuth';

export async function GET(request) {
  try {
    const next = new URL(request.url).searchParams.get('next') || '/player-record';
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/player-record';
    const state = await signDiscordPayload({ next: safeNext }, 10 * 60 * 1000);
    const response = NextResponse.redirect(discordAuthorizeUrl(state));
    response.cookies.set(DISCORD_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error('discord auth start failed', error);
    return NextResponse.redirect(new URL('/player-record?auth_error=discord_not_configured', request.url));
  }
}
