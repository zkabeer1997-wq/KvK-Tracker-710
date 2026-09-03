import { NextResponse } from 'next/server';
import { discoverWikiCodes, processRedemptionQueue } from '../../../../lib/giftCodes.mjs';

function noStoreJson(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

/**
 * Daily discovery + light queue processing.
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
    const queue = await processRedemptionQueue({ limit: 10, workerId: 'cron' });
    return noStoreJson({
      ok: true,
      discovery,
      queue,
      liveMode: process.env.GIFT_CODE_LIVE_MODE === '1',
    });
  } catch (error) {
    console.error('gift-codes cron failed', error);
    return noStoreJson({ error: 'Cron failed', detail: error?.message }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
