import Link from 'next/link';
import { PageHeader, Card } from '../../components/ui';
import {
  TIMELINE_MILESTONES,
  OPTIMIZER_TIMELINE_URL,
  OPTIMIZER_KINGDOM_URL,
} from '../../lib/kingdomExternalData.mjs';

export const metadata = {
  title: 'Timeline',
  description:
    'Kingdom 710 timeline — heroes, pets, Truegold, PvP milestones, and feature unlocks from Kingshot Optimizer.',
  alternates: { canonical: '/timeline' },
};

const CATEGORY_TONE = {
  Heroes: 'heroes',
  Pets: 'pets',
  Truegold: 'truegold',
  PvP: 'pvp',
  'New Feature': 'feature',
};

export default function TimelinePage() {
  return (
    <main className="theme-realm timeline-page">
      <div className="timeline-page-inner">
        <PageHeader
          eyebrow="Kingdom 710"
          title="Kingdom Timeline"
          description="Milestones for K710 — hero generations, pets, Truegold tiers, PvP firsts, and feature unlocks. Derived from Kingshot Optimizer."
        />

        <p className="timeline-source">
          Source:{' '}
          <a href={OPTIMIZER_TIMELINE_URL} target="_blank" rel="noopener noreferrer">
            kingshotoptimizer.com/kingdom-timeline/710
          </a>
          {' · '}
          <a href={OPTIMIZER_KINGDOM_URL} target="_blank" rel="noopener noreferrer">
            KvK history
          </a>
        </p>

        <ol className="timeline-list">
          {TIMELINE_MILESTONES.map((m, i) => (
            <li key={`${m.title}-${i}`} className="timeline-item">
              <div className="timeline-marker" aria-hidden="true" />
              <Card className="timeline-card">
                <div className="timeline-card-head">
                  <span className={`timeline-cat timeline-cat-${CATEGORY_TONE[m.category] || 'feature'}`}>
                    {m.category}
                  </span>
                  <span className="timeline-index">#{i + 1}</span>
                </div>
                <h2 className="timeline-title">{m.title}</h2>
                {m.notes && <p className="timeline-notes">{m.notes}</p>}
              </Card>
            </li>
          ))}
        </ol>

        <p className="timeline-footer">
          <Link href="/about">← Back to About</Link>
          {' · '}
          <a href={OPTIMIZER_TIMELINE_URL} target="_blank" rel="noopener noreferrer">
            Open live Optimizer timeline →
          </a>
        </p>
      </div>

      <style>{`
        .timeline-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .timeline-page-inner{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
        .timeline-source{margin:0;font-size:13px;color:var(--color-ink-muted)}
        .timeline-source a{color:var(--color-accent-strong)}
        .timeline-list{list-style:none;margin:0;padding:0 0 0 20px;border-left:2px solid var(--color-border);display:flex;flex-direction:column;gap:16px}
        .timeline-item{position:relative;padding-left:20px}
        .timeline-marker{position:absolute;left:-27px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--color-accent);border:2px solid var(--color-bg);box-shadow:0 0 0 2px var(--color-accent)}
        .timeline-card{padding:16px 18px;display:flex;flex-direction:column;gap:6px}
        .timeline-card-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
        .timeline-cat{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px}
        .timeline-cat-heroes{background:rgba(120,180,255,.15);color:#7eb8ff}
        .timeline-cat-pets{background:rgba(120,220,160,.15);color:#6ed9a0}
        .timeline-cat-truegold{background:rgba(255,200,80,.15);color:#f0c040}
        .timeline-cat-pvp{background:rgba(255,100,100,.15);color:#ff8a8a}
        .timeline-cat-feature{background:rgba(180,140,255,.15);color:#c4a8ff}
        .timeline-index{font-size:11px;color:var(--color-ink-muted)}
        .timeline-title{margin:0;font-family:var(--font-display);font-size:17px}
        .timeline-notes{margin:0;font-size:13px;color:var(--color-ink-muted);line-height:1.5}
        .timeline-footer{margin:8px 0 0;font-size:13.5px}
        .timeline-footer a{color:var(--color-accent-strong);font-weight:600}
      `}</style>
    </main>
  );
}
