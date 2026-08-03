import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

export async function POST(request) {
try {
const formData = await request.formData();
const supabase = createAdminSupabaseClient();

const screenshots = formData.getAll('screenshots').filter((f) => f && typeof f.arrayBuffer === 'function');
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
