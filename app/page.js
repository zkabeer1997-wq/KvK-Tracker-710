import Link from 'next/link';
import HomeEditableText from '../components/HomeEditableText';
import { getHomeContent, checkIsAdmin } from '../lib/homeContent';
import HomeForgeIntro from '../components/kingdom/world/HomeForgeIntro';
import RealmShield3D from '../components/kingdom/world/RealmShield3D';

export const metadata = {
  title: { absolute: 'Kingdom 710 — Three Alliances. One Kingdom.' },
  description: 'Kingdom 710 — a cinematic Kingshot kingdom hub with live member tools, alliance operations, and transfer intake.',
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const ALLIANCES = [
  { band: '710', nameKey: 'wb-1-name', descKey: 'wb-1-desc' },
  { band: 'RED', nameKey: 'wb-2-name', descKey: 'wb-2-desc' },
  { band: 'SKY', nameKey: 'wb-3-name', descKey: 'wb-3-desc' },
];

const DOCTRINE = [
  { titleKey: 'why-1-title', bodyKey: 'why-1-body' },
  { titleKey: 'why-2-title', bodyKey: 'why-2-body' },
  { titleKey: 'why-3-title', bodyKey: 'why-3-body' },
];

const COMMAND = [
  { href: '/events', title: 'Events', sub: 'Campaign schedule and kingdom timing' },
  { href: '/guides', title: 'Guides', sub: 'Strategy and kingdom knowledge' },
  { href: '/tools', title: 'Tools', sub: 'Optimizers, calculators and event utilities' },
  { href: '/power-profile', title: 'Power Profile', sub: 'Player strength and profile management' },
];

export default async function HomePage() {
  const content = await getHomeContent();
  const isAdmin = await checkIsAdmin();
  const field = (key, props = {}) => {
    const c = content[key] || { id: null, text: '' };
    return <HomeEditableText id={c.id} fieldKey={key} initialText={c.text} isAdmin={isAdmin} {...props} />;
  };

  return (
    <main className="theme-realm home-v2 home-crafted">
      <HomeForgeIntro />

      <section className="home-crafted-hero">
        <div className="home-crafted-hero-copy">
          <p className="home-crafted-context">{field('hero-kicker')}</p>
          <h1>{field('hero-title', { as: 'span' })}</h1>
          <p className="home-crafted-lede">{field('hero-sub', { as: 'span', multiline: true })}</p>
          <div className="home-crafted-actions">
            <Link href="/chronometer" className="home-crafted-primary">Request entry</Link>
            <Link href="/player-record" className="home-crafted-text-link">Member sign in <span aria-hidden="true">→</span></Link>
          </div>
        </div>

        <div className="home-crafted-emblem" aria-label="Kingdom 710 shield">
          <RealmShield3D />
          <p><strong>710</strong><span>Three alliances<br />One kingdom</span></p>
        </div>

        <div className="home-crafted-brief" aria-label="Kingdom brief">
          <span>Kingdom brief</span>
          <p><strong>710 · RED · SKY</strong><small>Coordinated alliance network</small></p>
          <p><strong>7 hunt windows</strong><small>Coverage across global time zones</small></p>
          <Link href="/events">View the live schedule →</Link>
        </div>
      </section>

      <section className="home-crafted-directory">
        <div className="home-crafted-section-copy">
          <p>{field('deck-head-kicker')}</p>
          <h2>{field('deck-head-title')}</h2>
          <div className="home-crafted-rule" />
          <p className="home-crafted-description">{field('deck-head-sub', { multiline: true })}</p>
        </div>
        <nav className="home-crafted-directory-list" aria-label="Member tools">
          {COMMAND.map((item) => (
            <Link key={item.href} href={item.href}><span><strong>{item.title}</strong><small>{item.sub}</small></span><b aria-hidden="true">↗</b></Link>
          ))}
        </nav>
      </section>

      <section className="home-crafted-story">
        <div className="home-crafted-story-heading">
          <p>{field('why-head-kicker')}</p>
          <h2>{field('why-head-title')}</h2>
          <p className="home-crafted-description">{field('why-head-sub', { multiline: true })}</p>
          <Link href="/about">Read the kingdom story →</Link>
        </div>
        <div className="home-crafted-principles">
          {DOCTRINE.map((d) => (
            <article key={d.titleKey}>
              <h3>{field(d.titleKey)}</h3>
              <p>{field(d.bodyKey, { multiline: true })}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-crafted-alliances">
        <div className="home-crafted-alliance-heading">
          <p>{field('wb-head-kicker')}</p>
          <h2>{field('wb-head-title')}</h2>
          <p className="home-crafted-description">{field('wb-head-sub', { multiline: true })}</p>
        </div>
        <div className="home-crafted-alliance-list">
          {ALLIANCES.map((a, index) => (
            <Link href={`/alliances/${a.band.toLowerCase()}`} key={a.band}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{a.band}</strong>
              <p>{field(a.descKey, { multiline: true })}</p>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-crafted-final">
        <p>Considering a move?</p>
        <h2>See whether 710 fits the way you play.</h2>
        <Link href="/chronometer">Start your transfer request <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
