import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import { publicPowerProfile, sanitizePowerProfileInput } from '../../../lib/powerProfiles.mjs';

const PUBLIC_COLUMNS = 'member_id,name,governor_gear,charms,hero_gear,pet_power,masters_power,updated_at';

function pinHash(pin) {
return createHash('sha256').update('kvk-power-profile-v1:' + pin).digest('hex');
}

function tableMissingResponse() {
return NextResponse.json({
error: 'Power profiles are not configured yet. Apply the power_profiles database migration first.',
}, { status: 500 });
}

function isMissingTableError(error) {
return error && (
error.code === '42P01' || String(error.message || '').toLowerCase().includes('power_profiles')
);
}

export async function GET(request) {
const url = new URL(request.url);
const memberId = String(url.searchParams.get('member_id') || '').trim();
if (!memberId) {
return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
}
try {
const supabase = createAdminSupabaseClient();
const { data, error } = await supabase
.from('power_profiles')
.select(PUBLIC_COLUMNS)
.eq('member_id', memberId)
.maybeSingle();
if (error) {
if (isMissingTableError(error)) return tableMissingResponse();
return NextResponse.json({ error: error.message }, { status: 500 });
}
return NextResponse.json({ profile: publicPowerProfile(data) });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}

export async function POST(request) {
let profile;
try {
profile = sanitizePowerProfileInput(await request.json());
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 400 });
}
try {
const supabase = createAdminSupabaseClient();
const { data: existing, error: selectError } = await supabase
.from('power_profiles')
.select('member_id,pin_hash')
.eq('member_id', profile.member_id)
.maybeSingle();
if (selectError) {
if (isMissingTableError(selectError)) return tableMissingResponse();
return NextResponse.json({ error: selectError.message }, { status: 500 });
}
const nextHash = pinHash(profile.pin);
if (existing && existing.pin_hash !== nextHash) {
return NextResponse.json({ error: 'Incorrect PIN for this Member ID. Please try again.' }, { status: 403 });
}
const payload = {
name: profile.name,
member_id: profile.member_id,
governor_gear: profile.governor_gear || null,
charms: profile.charms || null,
hero_gear: profile.hero_gear || null,
pet_power: profile.pet_power || null,
masters_power: profile.masters_power || null,
pin_hash: nextHash,
updated_at: new Date().toISOString(),
};
const { data, error } = await supabase
.from('power_profiles')
.upsert(payload, { onConflict: 'member_id' })
.select(PUBLIC_COLUMNS)
.single();
if (error) {
if (isMissingTableError(error)) return tableMissingResponse();
return NextResponse.json({ error: error.message }, { status: 500 });
}
return NextResponse.json({ profile: publicPowerProfile(data), status: existing ? 'updated' : 'created' });
} catch (error) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
