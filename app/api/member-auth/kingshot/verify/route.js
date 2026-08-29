import { NextResponse } from 'next/server';
import { createMemberToken, MEMBER_COOKIE_NAME, MEMBER_TOKEN_TTL_MS } from '../../../../../lib/memberAuth';

const TARGET_KINGDOM = 710;

function cleanPlayerId(value) {
  const id = String(value || '').trim();
  return /^\d{5,20}$/.test(id) ? id : '';
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const playerId = cleanPlayerId(body?.playerId);
  if (!playerId) {
    return NextResponse.json({ error: 'Enter a valid Kingshot Player ID.' }, { status: 400 });
  }

  const apiKey = process.env.KINGSHOT_STATS_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({
      error: 'Kingshot verification is not configured on this deployment yet.',
      configurationRequired: true,
    }, { status: 503 });
  }

  try {
    const response = await fetch(`https://api.kingshotstats.com/v1/players/${encodeURIComponent(playerId)}?include=base`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });

    if (response.status === 404) {
      return NextResponse.json({ error: 'That Kingshot Player ID could not be found.' }, { status: 404 });
    }
    if (!response.ok) {
      console.error('Kingshot Stats API error', response.status, await response.text());
      return NextResponse.json({ error: 'Kingshot could not be checked right now.' }, { status: 502 });
    }

    const result = await response.json();
    const player = result?.player || result?.data?.player || result?.data || result;
    const kingdomId = Number(player?.kid ?? player?.kingdom_id ?? player?.kingdomId ?? player?.state);
    const governorId = String(player?.governor_id ?? player?.fid ?? result?.governor_id ?? playerId);
    const nickname = String(player?.nick_name ?? player?.nickname ?? player?.name ?? 'Governor');

    if (kingdomId !== TARGET_KINGDOM) {
      return NextResponse.json({
        error: `This governor is currently in Kingdom ${Number.isFinite(kingdomId) ? kingdomId : 'unknown'}, not Kingdom 710.`,
        verified: false,
        kingdomId: Number.isFinite(kingdomId) ? kingdomId : null,
      }, { status: 403 });
    }

    const token = await createMemberToken(governorId);
    const out = NextResponse.json({
      ok: true,
      verified: true,
      memberId: governorId,
      player: {
        id: governorId,
        nickname,
        kingdomId,
        alliance: player?.alliance?.abbr || player?.alliance?.name || null,
        townCenterLevel: player?.town_center_level ?? null,
      },
      checkedAt: new Date().toISOString(),
    });
    out.cookies.set(MEMBER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MEMBER_TOKEN_TTL_MS / 1000,
    });
    return out;
  } catch (error) {
    console.error('kingshot member verification failed', error);
    return NextResponse.json({ error: 'Unable to verify Kingshot membership.' }, { status: 500 });
  }
}
