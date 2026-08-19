import { getVercelOidcToken } from '@vercel/oidc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const token = process.env.AI_GATEWAY_API_KEY || await getVercelOidcToken({ expirationBufferMs: 60_000 });
  if (!token) return Response.json({ auth: false }, { status: 503 });

  const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3.5-flash-lite',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Translate the user text into Spanish. Return only the translation.' },
        { role: 'user', content: 'Choose your language' },
      ],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  const payload = await response.json().catch(() => null);
  return Response.json({
    auth: true,
    gatewayStatus: response.status,
    output: payload?.choices?.[0]?.message?.content || null,
    error: response.ok ? null : payload,
  }, { status: response.ok ? 200 : 502 });
}
