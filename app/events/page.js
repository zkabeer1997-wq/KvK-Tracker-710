import { createAdminSupabaseClient } from '../../lib/adminSupabase';
import { PageHeader, Card, EmptyState, Button } from '../../components/ui';
import BearHuntSchedule from './BearHuntSchedule';
import EventCountdownCards from './EventCountdownCards';

export const metadata = {
  title: 'Events',
  description:
    'Kingdom 710 event calendar — Bear Hunt windows, KvK, Championship, and Swordland, with live countdowns in your local time.',
};

export const revalidate = 300;

async function loadUpcomingEvents() {
  const supabase = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('slug, title, kind, description, body_md, starts_at, ends_at')
    .eq('published', true)
    .gte('starts_at', cutoff)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default async function EventsPage() {
  let events = [];
  let loadError = '';
  try {
    events = await loadUpcomingEvents();
  } catch (error) {
    console.error('events page load failed', error);
    loadError = 'The event calendar could not be opened right now.';
  }

  return (
    <main className="theme-realm events-page">
      <div className="events-page-inner">
        <PageHeader
          eyebrow="Kingdom 710 Calendar"
          title="Events"
          description="Bear Hunt daily windows, plus KvK, Championship, Swordland, and other kingdom events — with live countdowns in your local time."
        />

        <section className="events-section">
          <h2 className="events-section-title">Bear Hunt — daily schedule</h2>
          <BearHuntSchedule />
        </section>

        <section className="events-section">
          <h2 className="events-section-title">Upcoming events</h2>
          <p className="events-section-lede">
            Published from the Admin Panel. Tap a card for full details without leaving this page.
          </p>
          {loadError ? (
            <Card className="events-error">{loadError}</Card>
          ) : events.length === 0 ? (
            <EmptyState
              icon="🗓️"
              title="No upcoming events yet"
              description="When an admin publishes an event, it will appear here with a live countdown."
            />
          ) : (
            <EventCountdownCards events={events} />
          )}
        </section>

        <Button href="/about" variant="quiet">← About Kingdom 710</Button>
      </div>

      <style>{`
        .events-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .events-page-inner{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:44px}
        .events-section{display:flex;flex-direction:column;gap:14px}
        .events-section-title{margin:0;font-family:var(--font-display);font-size:22px;letter-spacing:.02em;color:var(--color-ink)}
        .events-section-lede{margin:0;font-size:13.5px;color:var(--color-ink-muted);line-height:1.5;max-width:65ch}
        .events-hunts .ui-table th,.events-hunts .ui-table td{white-space:nowrap}
        .events-hunts-utc{color:var(--color-ink-muted);font-size:12px}
        .events-ics-link{display:inline-block;margin-top:14px;color:var(--color-accent-strong);font-weight:700;font-size:13px;text-decoration:none}
        .events-ics-link:hover{text-decoration:underline}
        .events-error{padding:20px;color:var(--color-ink-muted)}
      `}</style>
    </main>
  );
}
