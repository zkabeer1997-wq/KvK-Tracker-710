import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import {
  INTEREST_UPLOAD_LIMITS,
  isAcceptedInterestImage,
  validateProcessedInterestFiles,
} from '../../../lib/interestUploadLimits.mjs';

// Best-effort in-memory rate limit: 5 submissions per 10 minutes per IP.
// Honest limitation, not overclaimed: this Map lives in one warm serverless
// instance's memory. Vercel can and does route requests to multiple
// instances, and a cold start clears it, so this does not guarantee a
// global cap under real distributed load - it only raises the cost of a
// casual scripted flood on a single warm instance. A durable limiter needs
// a shared store (e.g. Upstash Redis), which is a real infra dependency
// this PR does not introduce unasked.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitHits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitHits.set(ip, hits);
  // Bound the map itself so a flood of distinct spoofed IPs cannot grow it
  // without limit for the lifetime of the warm instance.
  if (rateLimitHits.size > 5000) {
    const oldestKey = rateLimitHits.keys().next().value;
    rateLimitHits.delete(oldestKey);
  }
  return hits.length > RATE_LIMIT_MAX;
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// A human reading and filling five paginated steps takes more than this;
// a bot posting straight to the endpoint (or filling the form via script
// with no render delay) typically does not.
const MIN_FILL_TIME_MS = 3000;

export async function POST(request) {
try {
const ip = clientIp(request);
if (isRateLimited(ip)) {
  return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
}

const formData = await request.formData();

// Honeypot: a real applicant never sees or fills this field (hidden via
// CSS in InterestForm.js, not disabled/hidden by input type, since some
// bots specifically skip those). A filled value means a bot filled every
// field it could find. Return success without writing anything, so the
// bot's script sees no signal to adjust its behavior.
if (String(formData.get('website') || '').trim()) {
  return NextResponse.json({ ok: true });
}

const renderedAt = Number(formData.get('rendered_at')) || 0;
if (renderedAt && Date.now() - renderedAt < MIN_FILL_TIME_MS) {
  return NextResponse.json({ ok: true });
}

const supabase = createAdminSupabaseClient();

const screenshots = formData.getAll('screenshots').filter((f) => f && typeof f.arrayBuffer === 'function');
if (!screenshots.length) {
  return NextResponse.json({ error: 'Upload at least one battle report screenshot.' }, { status: 400 });
}
if (screenshots.length > INTEREST_UPLOAD_LIMITS.maxFiles) {
  return NextResponse.json({ error: `Upload no more than ${INTEREST_UPLOAD_LIMITS.maxFiles} screenshots.` }, { status: 400 });
}
if (screenshots.some((file) => !isAcceptedInterestImage(file))) {
  return NextResponse.json({ error: 'One image type is not supported. Use JPG, PNG, WebP, HEIC, or HEIF.' }, { status: 415 });
}
const processedFileError = validateProcessedInterestFiles(screenshots);
if (processedFileError) {
  return NextResponse.json({ error: processedFileError }, { status: 413 });
}
const screenshotUrls = [];
for (const file of screenshots) {
const arrayBuffer = await file.arrayBuffer();
const originalName = file.name || 'screenshot.png';
const ext = originalName.includes('.') ? originalName.split('.').pop() : 'png';
const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
const { error: uploadError } = await supabase.storage
.from('interest-screenshots')
.upload(path, Buffer.from(arrayBuffer), { contentType: file.type || 'application/octet-stream' });
if (uploadError) {
return NextResponse.json({ error: uploadError.message }, { status: 500 });
}
const { data: publicUrlData } = supabase.storage.from('interest-screenshots').getPublicUrl(path);
screenshotUrls.push(publicUrlData.publicUrl);
}

const payload = {
intake_period: String(formData.get('intake_period') || ''),
in_game_name: String(formData.get('in_game_name') || ''),
player_id: String(formData.get('player_id') || ''),
discord_username: String(formData.get('discord_username') || ''),
current_server: String(formData.get('current_server') || ''),
current_alliance: String(formData.get('current_alliance') || ''),
migrate_alliance: String(formData.get('migrate_alliance') || ''),
highest_troop_level: String(formData.get('highest_troop_level') || ''),
current_tg: String(formData.get('current_tg') || ''),
t11_units: formData.getAll('t11_units').map(String),
mystic_trial_stages: String(formData.get('mystic_trial_stages') || ''),
total_power: String(formData.get('total_power') || ''),
willing_reduce_power: String(formData.get('willing_reduce_power') || ''),
passes_required: String(formData.get('passes_required') || ''),
current_passes: String(formData.get('current_passes') || ''),
active_commit: String(formData.get('active_commit') || ''),
willing_save_resources: String(formData.get('willing_save_resources') || ''),
participates_battles: String(formData.get('participates_battles') || ''),
spending_archetype: String(formData.get('spending_archetype') || ''),
main_language: String(formData.get('main_language') || ''),
screenshot_urls: screenshotUrls,
};

if (!payload.in_game_name || !payload.player_id || !payload.discord_username) {
return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
}

const { error } = await supabase.from('interest_submissions').insert(payload);
if (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}

return NextResponse.json({ ok: true });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
