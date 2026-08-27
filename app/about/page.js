import Link from 'next/link';
import EditableSection from '../../components/EditableSection';
import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import { getHomeContent } from '../../lib/homeContent';
import { Button, Card } from '../../components/ui';

export const metadata = {
  title: 'About',
  description: 'About Kingdom 710 — a KvK-first Kingshot kingdom run across three coordinated alliances.',
  alternates: { canonical: '/about' },
};

const DOCTRINE_KEYS = [
  { titleKey: 'why-1-title', bodyKey: 'why-1-body' },
  { titleKey: 'why-2-title', bodyKey: 'why-2-body' },
  { titleKey: 'why-3-title', bodyKey: 'why-3-body' },
];

// Two sections here are deliberately empty until kingdom leadership fills
// them in: a real competitive record and credited third-party sources for
// any ranking/history data. Both use EditableSection - the same
// content_blocks-backed editor already live on /interest, /power-profile,
// etc. - rather than inventing a separate mechanism. No win/loss record,
// KvK history, or source citation is fabricated here; renders nothing
// until an admin adds real content, exactly like the guide stubs did
// before PR 7.
export default async function AboutPage() {
  const [recordBlocks, sourcesBlocks, isAdmin, homeContent] = await Promise.all([
    getBlocks('about-record'),
    getBlocks('about-sources'),
    checkIsAdmin(),
    getHomeContent(),
  ]);

  const hasRecord = recordBlocks.length > 0;
  const hasSources = sourcesBlocks.length > 0;

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

        <section className="about-section">
          <h2 className="about-section-title">Competitive record</h2>
          {(hasRecord || isAdmin) ? (
            <EditableSection page="about-record" initialBlocks={recordBlocks} isAdmin={isAdmin} as="div" className="about-editable" />
          ) : (
            <Card className="about-empty">
              Kingdom leadership will publish 710&rsquo;s KvK history and competitive record here.
            </Card>
          )}
        </section>

        <section className="about-section">
          <h2 className="about-section-title">Sources</h2>
          {(hasSources || isAdmin) ? (
            <EditableSection page="about-sources" initialBlocks={sourcesBlocks} isAdmin={isAdmin} as="div" className="about-editable" />
          ) : (
            <Card className="about-empty">
              Any third-party rankings or historical data referenced above will be credited here.
            </Card>
          )}
        </section>

        <section className="about-section about-links">
          <Button href="/alliances" variant="quiet">See all three alliances →</Button>
          <Button href="/chronometer" variant="quiet">Read the full recruitment story →</Button>
        </section>
      </div>

      <style>{`
        .about-page{padding:56px 24px 96px;background:var(--color-bg);color:var(--color-ink);min-height:100vh}
        .about-page-inner{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:40px}
        .about-head .k-mark{color:var(--color-accent-strong)}
        .about-title{margin:8px 0 0;font-family:var(--font-display);font-size:clamp(30px,5vw,48px)}
        .about-lede{margin:10px 0 0;font-size:17px;line-height:1.6;color:var(--color-ink-muted);max-width:65ch}
        .about-section-title{margin:0 0 16px;font-family:var(--font-display);font-size:20px}
        .about-doctrine{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
        .about-doctrine-card{padding:20px;display:flex;flex-direction:column;gap:8px}
        .about-doctrine-card .k-mark{color:var(--color-accent)}
        .about-doctrine-card h3{margin:0;font-family:var(--font-display);font-size:16px}
        .about-doctrine-card p{margin:0;font-size:13.5px;color:var(--color-ink-muted);line-height:1.55}
        .about-empty{padding:18px;color:var(--color-ink-muted);font-size:14px}
        .about-links{display:flex;gap:12px;flex-wrap:wrap}
      `}</style>
    </main>
  );
}
