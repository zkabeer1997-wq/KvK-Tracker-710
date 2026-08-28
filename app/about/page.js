import Link from 'next/link';
import EditableSection from '../../components/EditableSection';
import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import { getHomeContent } from '../../lib/homeContent';
import { createAdminSupabaseClient } from '../../lib/adminSupabase';
import { Button, Card, Tag } from '../../components/ui';
import {
  OPTIMIZER_RECORD,
  ATLAS_RANKING,
  OPTIMIZER_KINGDOM_URL,
  OPTIMIZER_RANKINGS_URL,
  ATLAS_KINGDOM_URL,
} from '../../lib/kingdomExternalData.mjs';

export const metadata = {
  title: 'About',
  description:
    'About Kingdom 710 — alliances, competitive KvK record, and live Optimizer & Atlas rankings.',
  alternates: { canonical: '/about' },
};

const DOCTRINE_KEYS = [
  { titleKey: 'why-1-title', bodyKey: 'why-1-body' },
  { titleKey: 'why-2-title', bodyKey: 'why-2-body' },
  { titleKey: 'why-3-title', bodyKey: 'why-3-body' },
];

const STATUS_LABEL = { open: 'Recruiting', selective: 'Selective', closed: 'Closed' };
const STATUS_TONE = { open: 'success', selective: 'accent', closed: 'neutral' };

async function loadAlliances() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('alliances')
      .select('tag, name, blurb, timezone_focus, recruiting_status, language, roster_size')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('about alliances load failed', error);
    return [];
  }
}

export default async function AboutPage() {
  const [recordBlocks, sourcesBlocks, isAdmin, homeContent, alliances] = await Promise.all([
    getBlocks('about-record'),
    getBlocks('about-sources'),
    checkIsAdmin(),
    getHomeContent(),
    loadAlliances(),
  ]);

  const hasSources = sourcesBlocks.length > 0;
  const rec = OPTIMIZER_RECORD;
  const atlas = ATLAS_RANKING;

  return (
    <main className="theme-realm about-page">
      <div className="about-page-inner">
        <header className="about-head">
          <span className="k-mark">Kingdom 710</span>
          <h1 className="about-title">About Kingdom 710</h1>
          <p className="about-lede">
            710 is a KvK-first Kingshot kingdom run across three coordinated alliances — 710, RED, and SKY —
            with Bear Hunt coverage in every timezone and real war-room tooling behind it.
          </p>
        </header>

        <section className="about-section">
          <h2 className="about-section-title">Doctrine</h2>
          <div className="about-doctrine">
            {DOCTRINE_KEYS.map((d, i) => (
              <Card key={d.titleKey} className="about-doctrine-card">
                <span className="k-mark">{['I', 'II', 'III'][i]}</span>
                <h3>{homeContent[d.titleKey]?.text}</h3>
                <p>{homeContent[d.bodyKey]?.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="about-section" id="alliances">
          <h2 className="about-section-title">Alliances</h2>
          <p className="about-section-lede">
            Three alliances, one kingdom. Each runs its own Bear Hunt schedule and recruiting posture.
          </p>
          {alliances.length === 0 ? (
            <Card className="about-empty">Alliance directory is loading or unavailable right now.</Card>
          ) : (
            <div className="about-alliances-grid">
              {alliances.map((a) => (
                <Link key={a.tag} href={`/alliances/${a.tag.toLowerCase()}`} className="about-alliance-link">
                  <Card className="about-alliance-card">
                    <div className="about-alliance-head">
                      <Tag band={a.tag}>{a.tag}</Tag>
                      <Tag tone={STATUS_TONE[a.recruiting_status] || 'neutral'}>
                        {STATUS_LABEL[a.recruiting_status] || a.recruiting_status}
                      </Tag>
                    </div>
                    <h3 className="about-alliance-name">{a.name}</h3>
                    {a.blurb && <p className="about-alliance-blurb">{a.blurb}</p>}
                    <dl className="about-alliance-facts">
                      {a.timezone_focus && (
                        <div><dt>Timezone</dt><dd>{a.timezone_focus}</dd></div>
                      )}
                      {a.roster_size != null && (
                        <div><dt>Roster</dt><dd>{a.roster_size}</dd></div>
                      )}
                      {a.language && (
                        <div><dt>Language</dt><dd>{a.language}</dd></div>
                      )}
                    </dl>
                    <span className="about-alliance-more">View alliance →</span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="about-section" id="competitive-record">
          <h2 className="about-section-title">Competitive record</h2>
          <p className="about-section-lede">
            Full record summary from{' '}
            <a href={OPTIMIZER_KINGDOM_URL} target="_blank" rel="noopener noreferrer">
              Kingshot Optimizer · Kingdom 710
            </a>
            .
          </p>
          <Card className="about-record-card">
            <div className="about-record-stats">
              <div>
                <span className="about-stat-label">KvKs</span>
                <strong>{rec.kvksParticipated}</strong>
              </div>
              <div>
                <span className="about-stat-label">Prep</span>
                <strong className="about-stat-split">
                  <span className="win">{rec.prep.wins}</span>
                  <span className="sep">–</span>
                  <span className="loss">{rec.prep.losses}</span>
                </strong>
              </div>
              <div>
                <span className="about-stat-label">Battle</span>
                <strong className="about-stat-split">
                  <span className="win">{rec.battle.wins}</span>
                  <span className="sep">–</span>
                  <span className="loss">{rec.battle.losses}</span>
                </strong>
              </div>
              <div>
                <span className="about-stat-label">Rating</span>
                <strong>{rec.rating}</strong>
              </div>
              <div>
                <span className="about-stat-label">Rank</span>
                <strong className="about-rank">#{rec.rank}</strong>
              </div>
            </div>
            <div className="about-record-matchups">
              <div>
                <span className="about-stat-label">Latest matchup · KvK {rec.latestMatchup.kvk}</span>
                <p>
                  vs K{rec.latestMatchup.opponent}
                  <span className="muted"> (#{rec.latestMatchup.opponentRank})</span>
                  {' · '}
                  <span className="win">Prep {rec.latestMatchup.prep}</span>
                  {' · '}
                  <span className="win">Battle {rec.latestMatchup.battle}</span>
                </p>
              </div>
              <div>
                <span className="about-stat-label">Toughest matchup · KvK {rec.toughestMatchup.kvk}</span>
                <p>
                  vs K{rec.toughestMatchup.opponent}
                  <span className="muted"> (#{rec.toughestMatchup.opponentRank})</span>
                  {' · '}
                  <span className="loss">Prep {rec.toughestMatchup.prep}</span>
                  {' · '}
                  <span className="loss">Battle {rec.toughestMatchup.battle}</span>
                </p>
              </div>
            </div>
            <a
              className="about-external-link"
              href={OPTIMIZER_KINGDOM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open full record on Optimizer →
            </a>
          </Card>
          {isAdmin && (
            <div className="about-admin-note">
              <EditableSection
                page="about-record"
                initialBlocks={recordBlocks}
                isAdmin={isAdmin}
                as="div"
                className="about-editable"
              />
            </div>
          )}
        </section>

        <section className="about-section" id="kingdom-rankings">
          <h2 className="about-section-title">Kingdom Rankings</h2>
          <div className="about-rankings-grid">
            <Card className="about-rank-box about-rank-optimizer">
              <h3>Optimizer Ranking</h3>
              <p className="about-rank-source">Kingshot Optimizer</p>
              <dl className="about-rank-facts">
                <div><dt>Rank</dt><dd>#{rec.rank}</dd></div>
                <div><dt>Rating</dt><dd>{rec.rating}</dd></div>
                <div><dt>Prep</dt><dd>{rec.prep.wins}–{rec.prep.losses}</dd></div>
                <div><dt>Battle</dt><dd>{rec.battle.wins}–{rec.battle.losses}</dd></div>
                <div><dt>KvKs</dt><dd>{rec.kvksParticipated}</dd></div>
              </dl>
              <a href={OPTIMIZER_RANKINGS_URL} target="_blank" rel="noopener noreferrer" className="about-external-link">
                View on Optimizer rankings →
              </a>
            </Card>

            <Card className="about-rank-box about-rank-atlas">
              <h3>Atlas Ranking</h3>
              <p className="about-rank-source">Kingshot Atlas</p>
              <div className="about-atlas-pill">
                <span>Atlas Score: <strong>{atlas.atlasScore}</strong></span>
                <span>Rank: <strong>#{atlas.rank}</strong></span>
                <span className="about-atlas-top">Top {atlas.topPercent}</span>
              </div>
              {atlas.tier && <p className="about-atlas-tier">{atlas.tier}</p>}
              <a href={ATLAS_KINGDOM_URL} target="_blank" rel="noopener noreferrer" className="about-external-link">
                View on Atlas →
              </a>
            </Card>
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">Sources</h2>
          {(hasSources || isAdmin) ? (
            <EditableSection page="about-sources" initialBlocks={sourcesBlocks} isAdmin={isAdmin} as="div" className="about-editable" />
          ) : (
            <Card className="about-empty">
              Rankings and competitive record are sourced from{' '}
              <a href={OPTIMIZER_KINGDOM_URL} target="_blank" rel="noopener noreferrer">Kingshot Optimizer</a>
              {' '}and{' '}
              <a href={ATLAS_KINGDOM_URL} target="_blank" rel="noopener noreferrer">Kingshot Atlas</a>.
            </Card>
          )}
        </section>

        <section className="about-section about-links">
          <Button href="/timeline" variant="quiet">Kingdom timeline →</Button>
          <Button href="/chronometer" variant="quiet">Read the full recruitment story →</Button>
        </section>
      </div>

      <style>{`
        .about-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .about-page-inner{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:40px}
        .about-head .k-mark{color:var(--color-accent-strong)}
        .about-title{margin:8px 0 0;font-family:var(--font-display);font-size:clamp(30px,5vw,48px)}
        .about-lede{margin:10px 0 0;font-size:17px;line-height:1.6;color:var(--color-ink-muted);max-width:65ch}
        .about-section-title{margin:0 0 8px;font-family:var(--font-display);font-size:20px}
        .about-section-lede{margin:0 0 16px;font-size:14px;color:var(--color-ink-muted);line-height:1.5}
        .about-section-lede a{color:var(--color-accent-strong)}
        .about-doctrine{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
        .about-doctrine-card{padding:20px;display:flex;flex-direction:column;gap:8px}
        .about-doctrine-card .k-mark{color:var(--color-accent)}
        .about-doctrine-card h3{margin:0;font-family:var(--font-display);font-size:16px}
        .about-doctrine-card p{margin:0;font-size:13.5px;color:var(--color-ink-muted);line-height:1.55}
        .about-alliances-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
        .about-alliance-link{text-decoration:none;color:inherit;display:block}
        .about-alliance-card{padding:18px;display:flex;flex-direction:column;gap:10px;height:100%;transition:border-color .16s,transform .16s}
        .about-alliance-link:hover .about-alliance-card{border-color:var(--color-accent);transform:translateY(-2px)}
        .about-alliance-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
        .about-alliance-name{margin:0;font-family:var(--font-display);font-size:18px}
        .about-alliance-blurb{margin:0;color:var(--color-ink-muted);font-size:13px;line-height:1.5}
        .about-alliance-facts{margin:0;display:flex;flex-direction:column;gap:4px}
        .about-alliance-facts div{display:flex;justify-content:space-between;gap:8px;font-size:12px;border-top:1px solid var(--color-border);padding-top:6px}
        .about-alliance-facts dt{color:var(--color-ink-muted);margin:0}
        .about-alliance-facts dd{margin:0;font-weight:700}
        .about-alliance-more{margin-top:auto;color:var(--color-accent-strong);font-weight:700;font-size:12.5px}
        .about-record-card{padding:22px;display:flex;flex-direction:column;gap:18px}
        .about-record-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:12px}
        .about-stat-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--color-ink-muted);margin-bottom:4px}
        .about-record-stats strong{font-size:22px;font-family:var(--font-display)}
        .about-rank{color:var(--color-accent-strong)}
        .about-stat-split .win{color:#3ecf8e}
        .about-stat-split .loss{color:#f07178}
        .about-stat-split .sep{margin:0 2px;color:var(--color-ink-muted)}
        .about-record-matchups{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;font-size:13.5px}
        .about-record-matchups p{margin:4px 0 0}
        .about-record-matchups .win{color:#3ecf8e;text-transform:capitalize}
        .about-record-matchups .loss{color:#f07178;text-transform:capitalize}
        .about-record-matchups .muted{color:var(--color-ink-muted)}
        .about-rankings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
        .about-rank-box{padding:20px;display:flex;flex-direction:column;gap:10px}
        .about-rank-box h3{margin:0;font-family:var(--font-display);font-size:18px}
        .about-rank-source{margin:0;font-size:12px;color:var(--color-ink-muted)}
        .about-rank-facts{margin:0;display:flex;flex-direction:column;gap:6px}
        .about-rank-facts div{display:flex;justify-content:space-between;font-size:13.5px;border-top:1px solid var(--color-border);padding-top:6px}
        .about-rank-facts dt{margin:0;color:var(--color-ink-muted)}
        .about-rank-facts dd{margin:0;font-weight:700}
        .about-atlas-pill{display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,rgba(56,140,220,.18),rgba(80,120,255,.12));border:1px solid rgba(100,160,255,.35);font-size:13.5px}
        .about-atlas-pill .about-atlas-top{color:#7ec8ff;font-weight:700}
        .about-atlas-tier{margin:0;font-size:13px;color:var(--color-accent-strong);font-weight:700}
        .about-external-link{margin-top:auto;font-size:13px;font-weight:700;color:var(--color-accent-strong);text-decoration:none}
        .about-external-link:hover{text-decoration:underline}
        .about-empty{padding:18px;color:var(--color-ink-muted);font-size:14px}
        .about-empty a{color:var(--color-accent-strong)}
        .about-links{display:flex;gap:12px;flex-wrap:wrap}
        .about-admin-note{margin-top:12px}
      `}</style>
    </main>
  );
}
