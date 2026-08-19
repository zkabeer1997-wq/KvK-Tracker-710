import uiStrings from '../../../public/ui-strings.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(uiStrings.map((value) => normalize(value)));
const MAX_STRINGS = 64;
const MAX_STRING_LENGTH = 320;
const DEFAULT_MODEL = 'google/gemini-3.5-flash-lite';

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function cleanJson(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Same-origin requests only.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const language = normalize(body?.language);
  const strings = Array.isArray(body?.strings) ? body.strings.map(normalize) : [];

  if (!language || language.length > 80 || /[\u0000-\u001f]/.test(language)) {
    return Response.json({ error: 'Invalid target language.' }, { status: 400 });
  }

  if (!strings.length || strings.length > MAX_STRINGS) {
    return Response.json({ error: `Send between 1 and ${MAX_STRINGS} strings.` }, { status: 400 });
  }

  if (strings.some((value) => !value || value.length > MAX_STRING_LENGTH || !ALLOWED.has(value))) {
    return Response.json({ error: 'Only static K710 interface strings may be translated.' }, { status: 400 });
  }

  if (/^english(?:\s*\(.*\))?$/i.test(language)) {
    return Response.json({ translated: strings });
  }

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return Response.json(
      { error: 'Translation service authentication is unavailable.' },
      { status: 503 },
    );
  }

  const model = process.env.K710_TRANSLATION_MODEL || DEFAULT_MODEL;
  const system = [
    'You are the translation engine for a Kingshot community website.',
    `Translate every item in the JSON array into ${language}.`,
    'Return ONLY a valid JSON array of strings, in the identical order and with the identical number of items.',
    'Preserve Kingdom 710, K710, Kingshot, KvK, alliance names, player names, acronyms, URLs, numbers, emoji, and format tokens exactly when they are proper nouns or identifiers.',
    'Translate ordinary interface labels, instructions, descriptions, headings, and form copy naturally and concisely.',
    'Do not add explanations, markdown, quotes around the whole response, or extra keys.',
  ].join(' ');

  let gatewayResponse;
  try {
    gatewayResponse = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(strings) },
        ],
      }),
      cache: 'no-store',
    });
  } catch {
    return Response.json({ error: 'Translation service could not be reached.' }, { status: 502 });
  }

  if (!gatewayResponse.ok) {
    const detail = await gatewayResponse.text().catch(() => '');
    console.error('K710 translation gateway error', gatewayResponse.status, detail.slice(0, 500));
    return Response.json({ error: 'Translation service returned an error.' }, { status: 502 });
  }

  let payload;
  try {
    payload = await gatewayResponse.json();
  } catch {
    return Response.json({ error: 'Translation service returned invalid data.' }, { status: 502 });
  }

  const content = payload?.choices?.[0]?.message?.content;
  let translated;
  try {
    translated = JSON.parse(cleanJson(content));
  } catch {
    translated = null;
  }

  if (
    !Array.isArray(translated) ||
    translated.length !== strings.length ||
    translated.some((value) => typeof value !== 'string')
  ) {
    console.error('K710 translation parse failure', String(content || '').slice(0, 500));
    return Response.json({ error: 'Translation response was malformed.' }, { status: 502 });
  }

  return Response.json(
    { translated },
    {
      headers: {
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    },
  );
}
