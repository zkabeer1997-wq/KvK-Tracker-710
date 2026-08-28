import Link from 'next/link';
import HomeEditableText from '../components/HomeEditableText';
import { getHomeContent, checkIsAdmin } from '../lib/homeContent';
import Chronometer from '../components/kingdom/world/Chronometer';
import GateBackdrop from '../components/kingdom/world/GateBackdrop';
import HomeForgeIntro from '../components/kingdom/world/HomeForgeIntro';
import { Button, Card, Tag } from '../components/ui';

export const metadata = {
  title: { absolute: 'Kingdom 710 — Three Alliances. One Kingdom.' },
  description:
    'Kingdom 710 is a KvK-first Kingshot kingdom run across three coordinated alliances, with Bear Hunt coverage in every timezone and real war-room tooling.',
  alternates: { canonical: '/' },
};

// Real content, server-rendered - the fix for the thing the whole portal
// plan started from: this page used to render nothing but
// <div id="main"><div class="k-scene"></div></div>. Every field below
// (hero-*, deck-*, events-*) was already defined in lib/homeContent.js's
// HOME_FIELDS and already stored in content_blocks - written for exactly
// this page, then never wired up anywhere. wb-*/why-* are also read by
// /chronometer, which keeps its own deeper treatment (full hunt windows,
// the transfer march, doctrine) as the "About" destination PR 4's nav
// already points to; this page is the concise front door, not a
// duplicate of it.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const ALLIANCES = [
  { band: '710', nameKey: 'wb-1-name', descKey: 'wb-1-desc' },
  { band: 'RED', nameKey: 'wb-2-name', descKey: 'wb-2-desc' },
  { band: 'SKY', nameKey: 'wb-3-name', descKey: 'wb-3-desc' },
];

const DOCTRINE = [
  { n: 'I', titleKey: 'why-1-title', bodyKey: 'why-1-body' },
  { n: 'II', titleKey: 'why-2-title', bodyKey: 'why-2-body' },
  { n: 'III', titleKey: 'why-3-title', bodyKey: 'why-3-body' },
];

const DECK = [
  { key: 'deck-1', labelKey: 'deck-1-label', subKey: 'deck-1-sub', href: '/forms' },
  { key: 'deck-2', labelKey: 'deck-2-label', subKey: 'deck-2-sub', href: '/power-profile' },
  { key: 'deck-3', labelKey: 'deck-3-label', subKey: 'deck-3-sub', href: '/admin' },
];

export default async function HomePage() {
  const content = await getHomeContent();
  const isAdmin = await checkIsAdmin();

  const field = (key, props = {}) => {
    const c = content[key] || { id: null, text: '' };
    return <HomeEditableText id={c.id} fieldKey={key} initialText={c.text} isAdmin={isAdmin} {...props} />;
  };

  return (
    <main className="theme-realm home-page">
      <HomeForgeIntro />

      {/* ---- Hero ---- */}
      <section className="home-hero">
        <GateBackdrop />
        <div className="home-hero-content">
          <span className="k-mark">{field('hero-kicker')}</span>
          <h1 className="home-hero-title">{field('hero-title', { as: 'span' })}</h1>
          <p className="home-hero-sub">{field('hero-sub', { as: 'span', multiline: true })}</p>
          <div className="home-hero-actions">
            <Button href="/interest" variant="struck">Join K710</Button>
            <Button href="/player-record" variant="quiet">Member Login</Button>
            <Button href="/gate" variant="quiet" className="home-hero-gate-link">
              Enter the Gate →
            </Button>
          </div>
          <Chronometer />
        </div>
      </section>

      {/* ---- Why govern with us ---- */}
      <section className="home-section">
        <header className="home-section-head">
          <span className="k-mark">{field('why-head-kicker')}</span>
          <h2 className="home-section-title">{field('why-head-title')}</h2>
          <p className="home-section-sub">{field('why-head-sub', { multiline: true })}</p>
        </header>
        <div className="home-doctrine">
          {DOCTRINE.map((d) => (
            <Card key={d.n} className="home-doctrine-card">
              <span className="home-doctrine-num k-mark">{d.n}</span>
              <h3 className="home-doctrine-title">{field(d.titleKey)}</h3>
              <p className="home-doctrine-body">{field(d.bodyKey, { multiline: true })}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- Alliance teaser ---- */}
      <section className="home-section">
        <header className="home-section-head">
          <span className="k-mark">{field('wb-head-kicker')}</span>
          <h2 className="home-section-title">{field('wb-head-title')}</h2>
          <p className="home-section-sub">{field('wb-head-sub', { multiline: true })}</p>
        </header>
        <div className="home-alliances">
          {ALLIANCES.map((a) => (
            <Card key={a.band} className="home-alliance-card">
              <Tag band={a.band}>{a.band}</Tag>
              <h3 className="home-alliance-name">{field(a.nameKey)}</h3>
              <p className="home-alliance-desc">{field(a.descKey, { multiline: true })}</p>
            </Card>
          ))}
        </div>
        <Link href="/chronometer" className="home-section-more">
          See the full alliance schedule and hunt windows →
        </Link>
      </section>

      {/* ---- Events teaser ---- */}
      <section className="home-section home-events">
        <Card className="home-events-card">
          <h2 className="home-section-title">{field('events-title')}</h2>
          <p className="home-section-sub">{field('events-body', { multiline: true })}</p>
        </Card>
      </section>

      {/* ---- Command deck (members) ---- */}
      <section className="home-section">
        <header className="home-section-head">
          <span className="k-mark">{field('deck-head-kicker')}</span>
          <h2 className="home-section-title">{field('deck-head-title')}</h2>
          <p className="home-section-sub">{field('deck-head-sub', { multiline: true })}</p>
        </header>
        <div className="home-deck">
          {DECK.map((d) => (
            <Link key={d.key} href={d.href} className="home-deck-item">
              <span className="home-deck-label">{field(d.labelKey)}</span>
              <span className="home-deck-sub">{field(d.subKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="home-section home-final-cta">
        <h2 className="home-section-title">Ready to march?</h2>
        <p className="home-section-sub">
          Bring your name, your strength, and your intent. The council reviews every petition.
        </p>
        <Button href="/interest" variant="struck">Approach the Registry</Button>
      </section>
    </main>
  );
}
