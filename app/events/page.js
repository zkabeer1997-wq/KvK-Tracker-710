import Link from 'next/link';
import { createAdminSupabaseClient } from '../../lib/adminSupabase';
import { PageHeader, Card, Tag, EmptyState, Button } from '../../components/ui';
import BearHuntSchedule from './BearHuntSchedule';

export const metadata = {
  title: 'Events',
  description: 'Kingdom 710 event calendar — Bear Hunt windows, KvK, Championship, and Swordland, in your local time.',
  alternates: { canonical: '/events' },
};

// Static generation alone would freeze "upcoming" at build time forever -
// the gte('starts_at', now) filter below needs to actually re-run
// periodically, or an event that passes stays listed and a newly-added
// one never appears until the next deploy. 5 minutes, matching events'
// actual pace of change (an admin publishing a new one, or one starting).
export const revalidate = 300;

const KIND_LABEL = {
  kvk: 'KvK',
  championship: 'Championship',
  swordland: 'Swordland',
  custom: 'Kingdom Event',
};

async function loadUpcomingEvents() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('events')
    .select('slug, title, kind, description, starts_at, ends_at')
    .eq('published', true)
    .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
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
          description="The recurring Bear Hunt schedule, plus KvK, Championship, Swordland, and other kingdom events — shown in your own local time."
        />

        <section className="events-section">
          <h2 className="events-section-title">Bear Hunt — daily schedule</h2>
          <BearHuntSchedule />
        </section>

        <section className="events-section">
          <h2 className="events-section-title">Upcoming events</h2>
          {loadError ? (
            <Card className="events-error">{loadError}</Card>
          ) : events.length === 0 ? (
            <EmptyState
              icon="🗓️"
              title="No upcoming events yet"
              description="KvK, Championship, and Swordland windows will appear here as leadership schedules them."
            />
          ) : (
            <div className="events-list">
              {events.map((event) => (
                <Link key={event.slug} href={`/events/${event.slug}`} className="events-list-item">
                  <div className="events-list-date">
                    <span className="events-list-day">{new Date(event.starts_at).getUTCDate()}</span>
                    <span className="events-list-month">
                      {new Date(event.starts_at).toLocaleString(undefined, { month: 'short', timeZone: 'UTC' })}
                    </span>
                  </div>
                  <div className="events-list-copy">
                    <Tag tone="accent">{KIND_LABEL[event.kind] || event.kind}</Tag>
                    <strong>{event.title}</strong>
                    <span className="events-list-desc">{event.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Button href="/chronometer" variant="quiet">← Back to the Chamber</Button>
      </div>

      <style>{`
        .events-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .events-page-inner{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:44px}
        .events-section{display:flex;flex-direction:column;gap:18px}
        .events-section-title{margin:0;font-family:var(--font-display);font-size:22px;letter-spacing:.02em;color:var(--color-ink)}
        .events-hunts .ui-table th,.events-hunts .ui-table td{white-space:nowrap}
        .events-hunts-utc{color:var(--color-ink-muted);font-size:12px}
        .events-ics-link{display:inline-block;margin-top:14px;color:var(--color-accent-strong);font-weight:700;font-size:13px;text-decoration:none}
        .events-ics-link:hover{text-decoration:underline}
        .events-error{padding:20px;color:var(--color-ink-muted)}
        .events-list{display:flex;flex-direction:column;gap:12px}
        .events-list-item{display:grid;grid-template-columns:64px 1fr;gap:18px;align-items:center;padding:16px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);text-decoration:none;color:inherit;transition:border-color .16s}
        .events-list-item:hover{border-color:var(--color-accent)}
        .events-list-date{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;border-radius:var(--radius-md);background:var(--color-surface-alt)}
        .events-list-day{font-family:var(--font-display);font-size:22px;font-weight:800;line-height:1}
        .events-list-month{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-ink-muted)}
        .events-list-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
        .events-list-copy strong{font-family:var(--font-display);font-size:17px}
        .events-list-desc{font-size:13px;color:var(--color-ink-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      `}</style>
    </main>
  );
}
