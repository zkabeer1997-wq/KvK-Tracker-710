const mirrors = [
  'https://translate.flossboxin.org.in',
  'https://translate.terraprint.co',
  'https://translate.argosopentech.com',
  'https://lt.blitzw.in',
];

async function check(baseUrl) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: ['Choose your language', 'Enter the Kingdom'],
      source: 'en',
      target: 'es',
      format: 'text',
    }),
    signal: AbortSignal.timeout(7000),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 180)}`);
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.translatedText) || payload.translatedText.length !== 2) {
    throw new Error(`bad payload ${text.slice(0, 180)}`);
  }
  return { ms: Date.now() - started, translated: payload.translatedText };
}

let successes = 0;
for (const mirror of mirrors) {
  try {
    const result = await check(mirror);
    successes += 1;
    console.log(`[translation-check] OK ${mirror} ${result.ms}ms -> ${JSON.stringify(result.translated)}`);
  } catch (error) {
    console.log(`[translation-check] FAIL ${mirror} -> ${error?.message || error}`);
  }
}

if (!successes) {
  console.error('[translation-check] No configured translation provider is reachable from Vercel.');
  process.exit(1);
}
