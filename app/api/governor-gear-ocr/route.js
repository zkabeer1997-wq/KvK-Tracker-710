import { NextResponse } from 'next/server';
import { normalizeGovernorGearReadings } from '../../../lib/governorGearOcr.mjs';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const OCR_ENDPOINT = process.env.GOVERNOR_GEAR_OCR_ENDPOINT || 'https://optimizer-ocr.zebrave.workers.dev/api/parse-govgear';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image || typeof image.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Choose a Governor Profile screenshot first.' }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.has(image.type)) {
      return NextResponse.json({ error: 'Use a PNG, JPEG, or WebP screenshot.' }, { status: 415 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'The screenshot must be smaller than 8 MB.' }, { status: 413 });
    }

    const upstreamBody = new FormData();
    upstreamBody.append('image', image, image.name || 'governor-gear.png');
    const response = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      body: upstreamBody,
      signal: AbortSignal.timeout(25000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Governor Gear OCR service error', response.status, payload?.error || 'Unknown OCR error');
      const status = response.status === 429 ? 429 : 502;
      return NextResponse.json({ error: status === 429 ? 'The scanner is busy. Please wait a moment and try again.' : 'The scanner could not read this image right now.' }, { status });
    }

    const normalized = normalizeGovernorGearReadings(payload?.slots);
    if (Object.keys(normalized.selections).length < 6) {
      return NextResponse.json({ error: 'All six Governor Gear pieces were not clear. Use the full, uncropped Governor Profile screen and try again.' }, { status: 422 });
    }

    return NextResponse.json({ ok: true, ...normalized });
  } catch (error) {
    console.error('Governor Gear OCR failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'The screenshot could not be processed. Please try again.' }, { status: 500 });
  }
}
