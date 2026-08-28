import { NextResponse } from 'next/server';
import { getVercelOidcToken } from '@vercel/oidc';
import { normalizeGovernorGearReadings } from '../../../lib/governorGearOcr.mjs';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MODEL = process.env.GOVERNOR_GEAR_OCR_MODEL || 'openai/gpt-5.6-luna';

const OCR_PROMPT = `Read ONLY the six Governor Gear pieces from this Kingshot Governor Profile screenshot.
Return one object for each visible slot. Slot identities are fixed by item shape and screen position:
- hat: upper-left headwear (Cavalry 1)
- pendant: lower-left necklace (Cavalry 2)
- shirt: upper-center body armor (Infantry 1)
- pants: lower-center leg armor (Infantry 2)
- ring: upper-right ring (Archer 1)
- baton: lower-right weapon/baton (Archer 2)

For every slot return:
- piece: exactly hat, pendant, shirt, pants, ring, or baton
- rarity: exactly green, blue, purple, gold, or red. Orange-looking legendary gear is gold.
- tier: Regular when there is no T badge, otherwise T1 through T6 exactly as displayed.
- stars: 0 through 3, counting filled stars for that piece.
- confidence: 0 to 1 for the complete reading.

Do not read hero gear, charms, power, player text, or any other screen. If the full six-piece Governor Profile arrangement is not visible, return an empty slots array.`;

function extractJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

async function gatewayToken() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  return getVercelOidcToken();
}

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

    const bytes = Buffer.from(await image.arrayBuffer());
    const token = await gatewayToken();
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: OCR_PROMPT },
            { type: 'image_url', image_url: { url: `data:${image.type};base64,${bytes.toString('base64')}`, detail: 'high' } },
          ],
        }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 900,
      }),
      signal: AbortSignal.timeout(25000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Governor Gear OCR gateway error', response.status, payload?.error?.message || 'Unknown gateway error');
      const status = response.status === 429 ? 429 : 502;
      return NextResponse.json({ error: status === 429 ? 'The scanner is busy. Please wait a moment and try again.' : 'The scanner could not read this image right now.' }, { status });
    }

    const parsed = extractJson(payload?.choices?.[0]?.message?.content);
    const normalized = normalizeGovernorGearReadings(parsed?.slots);
    if (Object.keys(normalized.selections).length < 6) {
      return NextResponse.json({ error: 'All six Governor Gear pieces were not clear. Use the full, uncropped Governor Profile screen and try again.' }, { status: 422 });
    }

    return NextResponse.json({ ok: true, ...normalized });
  } catch (error) {
    console.error('Governor Gear OCR failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'The screenshot could not be processed. Please try again.' }, { status: 500 });
  }
}
