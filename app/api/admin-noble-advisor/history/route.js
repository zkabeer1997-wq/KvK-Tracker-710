import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../../lib/adminSupabase';

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data: cycles, error } = await supabase
      .from('event_cycle_archives')
      .select('id,event_id,occurrence_starts_at,occurrence_ends_at')
      .eq('kind', 'tyrant')
      .order('occurrence_starts_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const eventIds = [...new Set((cycles || []).map((cycle) => cycle.event_id).filter(Boolean))];
    const { data: events, error: eventsError } = eventIds.length
      ? await supabase.from('events').select('id,title').in('id', eventIds)
      : { data: [], error: null };
    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }
    const titleById = new Map((events || []).map((event) => [event.id, event.title]));
    return NextResponse.json({
      cycles: (cycles || []).map((cycle) => ({
        id: cycle.id,
        title: titleById.get(cycle.event_id) || 'Cycle',
        starts_at: cycle.occurrence_starts_at,
        ends_at: cycle.occurrence_ends_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
