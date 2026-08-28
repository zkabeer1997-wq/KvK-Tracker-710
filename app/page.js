import Link from 'next/link';
import HomeEditableText from '../components/HomeEditableText';
import { getHomeContent, checkIsAdmin } from '../lib/homeContent';
import { HUNTS } from '../lib/bearHuntSchedule';
import Chronometer from '../components/kingdom/world/Chronometer';
import HomeForgeIntro from '../components/kingdom/world/HomeForgeIntro';
import { Button, Tag } from '../components/ui';

export const metadata = {
  title: { absolute: 'Kingdom 710 — Three Alliances. One Kingdom.' },
  description: 'Kingdom 710 is a KvK-first Kingshot kingdom run across three coordinated alliances, with Bear Hunt coverage in every timezone and real war-room tooling.',
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
const DECK = [
  { labelKey: 'deck-1-label', subKey: 'deck-1-sub', href: '/forms', mark: 'Rally' },
  { labelKey: 'deck-2-label', subKey: 'deck-2-sub', href: '/power-profile', mark: 'Profile' },
  { labelKey: 'deck-3-label', subKey: 'deck-3-sub', href: '/admin', mark: 'Council' },
];

export default async function HomePage() {
  const [content, isAdmin] = await Promise.all([getHomeContent(), checkIsAdmin()]);
  const field = (key, props = {}) => {
    const c = content[key] || { id: null, text: '' };
    if (!isAdmin) {
      const Tag = props.as || 'span';
      return <Tag className={props.className}>{c.text}</Tag>;
    }
    return <HomeEditableText id={c.id} fieldKey={key} initialText={c.text} isAdmin={isAdmin} {...props} />;
  };

  return (
    <main className="theme-realm home-page">
      <HomeForgeIntro />

      <section className="home-command-hero">
        <div className="home-gate-art" aria-hidden="true">
          <span className="home-gate-tower home-gate-tower-left" />
          <span className="home-gate-tower home-gate-tower-right" />
          <span className="home-gate-arch" />
          <span className="home-gate-road" />
        </div>
        <div className="home-command-wrap">
          <div className="home-hero-copy">
            <span className="k-mark">{field('hero-kicker')}</span>
            <h1 className="home-hero-title">{field('hero-title', { as: 'span' })}</h1>
            <p className="home-hero-sub">{field('hero-sub', { as: 'span', multiline: true })}</p>
            <div className="home-status-line"><span className="home-status-pulse" aria-hidden="true" />Transfer registry accepting interest</div>
            <div className="home-hero-actions">
              <Button href="/chronometer" variant="struck">Join K710</Button>
              <Button href="/player-record" variant="quiet">Member Login</Button>
            </div>
          </div>
          <aside className="home-watch" aria-label="Live kingdom watch">
            <div className="home-watch-heading"><span>Live Kingdom Watch</span><Link href="/events">Full calendar →</Link></div>
            <Chronometer />
          </aside>
        </div>
        <div className="home-hunt-strip" aria-label="Bear Hunt schedule">
          <span className="home-hunt-label">Seven daily hunt windows</span>
          <div className="home-hunt-times">
            {HUNTS.map((hunt) => <span key={`${hunt.band}-${hunt.utc}`} data-band={hunt.band}><b>{hunt.band}</b> {hunt.utc}</span>)}
          </div>
          <span className="home-hunt-zone">UTC</span>
        </div>
      </section>

      <nav className="home-paths" aria-label="Choose your K710 path">
        <Link href="/chronometer" className="home-path home-path-transfer">
          <span className="home-path-index">For prospective transfers</span><strong>Considering K710?</strong>
          <span>See our alliances, standards, schedule, and application route.</span><i aria-hidden="true">Explore the kingdom →</i>
        </Link>
        <Link href="/tools" className="home-path home-path-member">
          <span className="home-path-index">For current members</span><strong>Already marching with us?</strong>
          <span>Open the tools, forms, profiles, and live event command center.</span><i aria-hidden="true">Enter command deck →</i>
        </Link>
      </nav>

      <section className="home-doctrine-section">
        <div className="home-doctrine-intro">
          <span className="k-mark">{field('why-head-kicker')}</span><h2>{field('why-head-title')}</h2>
          <p>{field('why-head-sub', { multiline: true })}</p><Link href="/timeline">View the kingdom campaign record →</Link>
        </div>
        <div className="home-doctrine-list">
          {DOCTRINE.map((item, index) => (
            <article key={item.titleKey}><span>0{index + 1}</span><div><h3>{field(item.titleKey)}</h3><p>{field(item.bodyKey, { multiline: true })}</p></div></article>
          ))}
        </div>
      </section>

      <section className="home-alliance-section">
        <header className="home-alliance-heading">
          <div><span className="k-mark">{field('wb-head-kicker')}</span><h2>{field('wb-head-title')}</h2></div>
          <p>{field('wb-head-sub', { multiline: true })}</p>
        </header>
        <div className="home-alliance-banners">
          {ALLIANCES.map((alliance) => {
            const times = HUNTS.filter((hunt) => hunt.band === alliance.band).map((hunt) => hunt.utc);
            return (
              <article key={alliance.band} className="home-alliance-banner" data-band={alliance.band}>
                <div className="home-alliance-sigil"><Tag band={alliance.band}>{alliance.band}</Tag></div>
                <div className="home-alliance-copy"><h3>{field(alliance.nameKey)}</h3><p>{field(alliance.descKey, { multiline: true })}</p></div>
                <div className="home-alliance-times"><span>Daily hunts</span><strong>{times.join(' · ')}</strong><small>UTC</small></div>
              </article>
            );
          })}
        </div>
        <Link href="/chronometer" className="home-section-more">Compare all hunt windows and alliances →</Link>
      </section>

      <section className="home-operations-section">
        <div className="home-operations-heading">
          <span className="k-mark">{field('deck-head-kicker')}</span><h2>{field('deck-head-title')}</h2><p>{field('deck-head-sub', { multiline: true })}</p>
        </div>
        <div className="home-deck">
          {DECK.map((item) => (
            <Link key={item.labelKey} href={item.href} className="home-deck-item">
              <span className="home-deck-mark">{item.mark}</span>
              <span className="home-deck-copy"><strong>{field(item.labelKey)}</strong><small>{field(item.subKey)}</small></span>
              <span className="home-deck-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
          <Link href="/events" className="home-deck-item home-deck-featured">
            <span className="home-deck-mark">Live</span><span className="home-deck-copy"><strong>Event Command</strong><small>calendar, timers & schedules</small></span><span className="home-deck-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="home-transfer-panel">
        <div><span className="home-status-line"><span className="home-status-pulse" aria-hidden="true" />Registry open</span>
          <h2>Your next kingdom should earn your transfer.</h2><p>Review how K710 operates, choose the alliance window that fits your day, and introduce yourself to the council.</p></div>
        <div className="home-transfer-actions"><Button href="/chronometer" variant="struck">Approach the Registry</Button><Link href="/about">Read about K710 →</Link></div>
      </section>
    </main>
  );
}
