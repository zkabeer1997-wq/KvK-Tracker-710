import { createAdminSupabaseClient } from '../../lib/adminSupabase';
import { computeRankingDeltas } from '../../lib/rankingCsv';
import { PageHeader, Card, Tag, EmptyState, Table } from '../../components/ui';

export const metadata = {
  title: 'Rankings',
  description: 'Kingdom, alliance, and player rankings for Kingdom 710 — ranked by a stated metric, dated, credited to a source, with trend deltas between snapshots.',
  alternates: { canonical: '/rankings' },
};

// Rankings only change when an admin posts a new snapshot, so there's no
// need to poll the DB on every request - a short revalidation window keeps
// a freshly-published snapshot showing up quickly without hitting Supabase
// on every visit, matching the /events pattern (PR 8).
export const revalidate = 300;

const SCOPES = [
  { key: 'kingdom', label: 'Kingdom' },
  { key: 'alliance', label: 'Alliance' },
  { key: 'player', label: 'Player' },
];

async function loadLatestTwo(scope) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('ranking_snapshots')
    .select('id, scope, metric, source, rows, captured_at')
    .eq('scope', scope)
    .eq('published', true)
    .order('captured_at', { ascending: false })
    .limit(2);
  if (error) throw error;
  return data || [];
}

export default async function RankingsPage() {
  const results = await Promise.allSettled(SCOPES.map((s) => loadLatestTwo(s.key)));

  return (
    <main className="theme-realm rankings-page">
      <div className="rankings-page-inner">
        <PageHeader
          eyebrow="Kingdom 710"
          title="Rankings"
          description="Ranked by a stated metric, dated, and credited to a source — with trend deltas between snapshots, not just a static list."
        />

        {SCOPES.map((scopeDef, i) => {
          const outcome = results[i];
          const snapshots = outcome.status === 'fulfilled' ? outcome.value : [];
          const [latest, previous] = snapshots;
          const loadError = outcome.status === 'rejected';
          if (loadError) console.error('rankings page load failed', outcome.reason);

          const rankedRows = latest
            ? computeRankingDeltas(latest.rows, previous?.rows).sort((a, b) => a.rank - b.rank)
            : [];

          return (
            <section key={scopeDef.key} className="rankings-section">
              <h2 className="rankings-section-title">{scopeDef.label}</h2>

              {loadError ? (
                <Card className="rankings-error">Rankings could not be loaded right now.</Card>
              ) : !latest ? (
                <EmptyState
                  icon="📊"
                  title="Not published yet"
                  description={`No ${scopeDef.label.toLowerCase()} ranking has been posted yet. Check back soon.`}
                />
              ) : (
                <>
                  <div className="rankings-meta">
                    <span><strong>Metric:</strong> {latest.metric}</span>
                    <span>
                      <strong>Last updated:</strong>{' '}
                      {new Date(latest.captured_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {latest.source && <span><strong>Source:</strong> {latest.source}</span>}
                  </div>
                  <Table>
                    <thead>
                      <tr><th>Rank</th><th>Name</th><th>Value</th><th>Trend</th></tr>
                    </thead>
                    <tbody>
                      {rankedRows.map((row) => (
                        <tr key={`${row.name}-${row.rank}`}>
                          <td>#{row.rank}</td>
                          <td>{row.name}</td>
                          <td>{row.value != null ? row.value.toLocaleString() : '—'}</td>
                          <td>
                            {row.delta == null ? (
                              <Tag tone="neutral">New</Tag>
                            ) : row.delta > 0 ? (
                              <Tag tone="success">{'↑'} {row.delta}</Tag>
                            ) : row.delta < 0 ? (
                              <Tag tone="danger">{'↓'} {Math.abs(row.delta)}</Tag>
                            ) : (
                              <Tag tone="neutral">{'—'}</Tag>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </section>
          );
        })}
      </div>

      <style>{`
        .rankings-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .rankings-page-inner{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:40px}
        .rankings-section{display:flex;flex-direction:column;gap:16px}
        .rankings-section-title{margin:0;font-family:var(--font-display);font-size:22px}
        .rankings-error{padding:20px;color:var(--color-ink-muted)}
        .rankings-meta{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--color-ink-muted)}
        .rankings-meta strong{color:var(--color-ink)}
      `}</style>
    </main>
  );
}
