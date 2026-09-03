import { NextResponse } from 'next/server';
import { discoverWikiCodes } from '../../../../lib/giftCodes.mjs';

function noStoreJson(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

/**
 * Daily wiki check. When a new code is found, it's queued (status 'pending')
 * for every enrolled member - see discoverWikiCodes(). There is no automated
 * redemption step: members complete and self-report redemption themselves.
 * Secure with CRON_SECRET (Vercel Cron Authorization header) or admin password Bearer.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  const isCron =
    cronSecret &&
    (authHeader === `Bearer ${cronSecret}` || request.headers.get('x-vercel-cron') === '1');

  const adminBearer = process.env.ADMIN_PASSWORD && authHeader === `Bearer ${process.env.ADMIN_PASSWORD}`;

  if (!isCron && !adminBearer) {
    return noStoreJson({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const discovery = await discoverWikiCodes();
    return noStoreJson({ ok: true, discovery });
  } catch (error) {
    console.error('gift-codes cron failed', error);
    return noStoreJson({ error: 'Cron failed', detail: error?.message }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
