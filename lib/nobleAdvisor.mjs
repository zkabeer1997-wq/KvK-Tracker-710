export const TIME_SLOTS = [
  '23:45', '00:15', '00:45', '01:15', '01:45', '02:15', '02:45', '03:15', '03:45', '04:15',
  '04:45', '05:15', '05:45', '06:15', '06:45', '07:15', '07:45', '08:15', '08:45', '09:15',
  '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15',
  '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15',
  '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15',
];

export const NOBLE_FIELDS = ['in_game_name','want_troop_training','is_transfer','troop_speedup_days','promoting_t11','avail_day4'];
export function validateNobleAdvisor(input) {
 const record = Object.fromEntries(NOBLE_FIELDS.filter(k=>k!=='avail_day4').map(k=>[k,String(input?.[k] ?? '').trim()]));
 if (!record.in_game_name || record.in_game_name.length > 120) return { error: 'Enter your in-game name (up to 120 characters).' };
 if (!['Yes','No'].includes(record.want_troop_training)) return { error: 'Choose whether you want a Troop Training appointment.' };
 if (!['','Yes','No'].includes(record.is_transfer) || !['','Yes','No'].includes(record.promoting_t11)) return { error: 'Choose Yes or No for transfer and T11 promotion.' };
 const days = record.troop_speedup_days.replace(/[,\s+]/g,'');
 if (days && (!/^\d+(\.\d+)?$/.test(days) || Number(days)>100000)) return { error: 'Enter a valid number of speedup days.' };
 record.troop_speedup_days = days;
 if (!Array.isArray(input?.avail_day4) || input.avail_day4.some(t=>!TIME_SLOTS.includes(t))) return { error: 'Choose valid UTC appointment times.' };
 record.avail_day4 = [...new Set(input.avail_day4)];
 if (record.want_troop_training === 'Yes' && (!days || !record.is_transfer || !record.promoting_t11 || !record.avail_day4.length)) return { error: 'Complete the training questions and choose at least one available time.' };
 return { record };
}
