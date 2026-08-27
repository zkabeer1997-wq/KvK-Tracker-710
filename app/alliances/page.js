import Link from 'next/link';
import { createAdminSupabaseClient } from '../../lib/adminSupabase';
import { PageHeader, Card, Tag, EmptyState } from '../../components/ui';

export const metadata = {
  title: 'Alliances',
  description: 'The three alliances of Kingdom 710 — 710, RED, and SKY. Roster size, timezone coverage, and recruiting status for each.',
  alternates: { canonical: '/alliances' },
};

const STATUS_LABEL = { open: 'Recruiting', selective: 'Selective', closed: 'Closed' };
const STATUS_TONE = { open: 'success', selective: 'accent', closed: 'neutral' };

async function loadAlliances() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('alliances')
    .select('tag, name, blurb, timezone_focus, recruiting_status, language, roster_size')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default async function AlliancesPage() {
  let alliances = [];
  let loadError = '';
  try {
    alliances = await loadAlliances();
  } catch (error) {
    console.error('alliances page load failed', error);
    loadError = 'The alliance directory could not be opened right now.';
  }

  return (
    <main className="theme-realm alliances-page">
      <div className="alliances-page-inner">
        <PageHeader
          eyebrow="Kingdom 710"
          title="Alliances"
          description="Three alliances, one kingdom. Every alliance runs its own Bear Hunt schedule and recruiting posture — here's what each one covers."
        />

        {loadError ? (
          <Card className="alliances-error">{loadError}</Card>
        ) : alliances.length === 0 ? (
          <EmptyState icon="🛡️" title="No alliances published yet" description="Check back soon." />
        ) : (
          <div className="alliances-grid">
            {alliances.map((a) => (
              <Link key={a.tag} href={`/alliances/${a.tag.toLowerCase()}`} className="alliance-card-link">
                <Card className="alliance-card">
                  <div className="alliance-card-head">
                    <Tag band={a.tag}>{a.tag}</Tag>
                    <Tag tone={STATUS_TONE[a.recruiting_status] || 'neutral'}>
                      {STATUS_LABEL[a.recruiting_status] || a.recruiting_status}
                    </Tag>
                  </div>
                  <h2 className="alliance-card-name">{a.name}</h2>
                  <p className="alliance-card-blurb">{a.blurb}</p>
                  <dl className="alliance-card-facts">
                    {a.timezone_focus && (
                      <div><dt>Timezone focus</dt><dd>{a.timezone_focus}</dd></div>
                    )}
                    {a.roster_size != null && (
                      <div><dt>Roster</dt><dd>{a.roster_size} members</dd></div>
                    )}
                    {a.language && (
                      <div><dt>Language</dt><dd>{a.language}</dd></div>
                    )}
                  </dl>
                  <span className="alliance-card-more">View alliance →</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .alliances-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .alliances-page-inner{max-width:1000px;margin:0 auto;display:flex;flex-direction:column;gap:32px}
        .alliances-error{padding:20px;color:var(--color-ink-muted)}
        .alliances-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
        .alliance-card-link{text-decoration:none;color:inherit;display:block}
        .alliance-card{padding:24px;display:flex;flex-direction:column;gap:12px;height:100%;transition:border-color .16s,transform .16s}
        .alliance-card-link:hover .alliance-card{border-color:var(--color-accent);transform:translateY(-2px)}
        .alliance-card-head{display:flex;justify-content:space-between;align-items:center}
        .alliance-card-name{margin:0;font-family:var(--font-display);font-size:24px}
        .alliance-card-blurb{margin:0;color:var(--color-ink-muted);font-size:14px;line-height:1.55}
        .alliance-card-facts{margin:0;display:flex;flex-direction:column;gap:4px}
        .alliance-card-facts div{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;border-top:1px solid var(--color-border);padding-top:6px}
        .alliance-card-facts dt{color:var(--color-ink-muted);margin:0}
        .alliance-card-facts dd{margin:0;font-weight:700}
        .alliance-card-more{margin-top:auto;padding-top:8px;color:var(--color-accent-strong);font-weight:700;font-size:13px}
      `}</style>
    </main>
  );
}
