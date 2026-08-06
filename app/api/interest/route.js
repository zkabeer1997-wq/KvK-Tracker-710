import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

const MAX_FIELD_LENGTH = 200;
const MAX_ARRAY_ITEMS = 10;

function text(value) {
  return String(value || '').trim().slice(0, MAX_FIELD_LENGTH);
}

export async function POST(request) {
  if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 32_768) return NextResponse.json({ error: 'Submission is too large.' }, { status: 413 });
  try {
    const formData = await request.formData();
    const array = (name) => formData.getAll(name).map(text).filter(Boolean).slice(0, MAX_ARRAY_ITEMS);
    const payload = {
      intake_period: text(formData.get('intake_period')),
      in_game_name: text(formData.get('in_game_name')),
      player_id: text(formData.get('player_id')),
      discord_username: text(formData.get('discord_username')),
      current_server: text(formData.get('current_server')),
      current_alliance: text(formData.get('current_alliance')),
      migrate_alliance: text(formData.get('migrate_alliance')),
      highest_troop_level: text(formData.get('highest_troop_level')),
      current_tg: text(formData.get('current_tg')),
      t11_units: array('t11_units'),
      mystic_trial_stages: text(formData.get('mystic_trial_stages')),
      total_power: text(formData.get('total_power')),
      willing_reduce_power: text(formData.get('willing_reduce_power')),
      passes_required: text(formData.get('passes_required')),
      current_passes: text(formData.get('current_passes')),
      active_commit: text(formData.get('active_commit')),
      willing_save_resources: text(formData.get('willing_save_resources')),
      participates_battles: text(formData.get('participates_battles')),
      spending_archetype: text(formData.get('spending_archetype')),
      main_language: text(formData.get('main_language')),
    };
    if (!payload.in_game_name || !payload.player_id || !payload.discord_username) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const { error } = await createAdminSupabaseClient().from('interest_submissions').insert(payload);
    if (error) return NextResponse.json({ error: 'Unable to save the submission.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  }
}
