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
  { n: 'I', titleKey: 'why-1-title', bodyKey: 'why-1-body' },
  { n: 'II', titleKey: 'why-2-title', bodyKey: 'why-2-body' },
  { n: 'III', titleKey: 'why-3-title', bodyKey: 'why-3-body' },
];

const COMMAND = [
  { n: '01', href: '/events', title: 'Events', sub: 'Campaign schedule and kingdom timing' },
  { n: '02', href: '/guides', title: 'Guides', sub: 'Doctrine, strategy and kingdom knowledge' },
  { n: '03', href: '/tools', title: 'Tools', sub: 'Optimizers, calculators and event utilities' },
  { n: '04', href: '/power-profile', title: 'Power Profile', sub: 'Player strength and profile management' },
];

export default async function HomePage() {
  const content = await getHomeContent();
  const isAdmin = await checkIsAdmin();
  const field = (key, props = {}) => {
    const c = content[key] || { id: null, text: '' };
    return <HomeEditableText id={c.id} fieldKey={key} initialText={c.text} isAdmin={isAdmin} {...props} />;
  };

  return (
    <main className="theme-realm home-v2">
      <HomeForgeIntro />

      <section className="home-v2-hero">
        <div className="home-v2-sun" />
        <div className="home-v2-mountain home-v2-mountain-back" />
        <div className="home-v2-mountain home-v2-mountain-front" />
        <div className="home-v2-citadel"><i/><i/><i/></div>
        <div className="home-v2-forge-beam" />

        <div className="home-v2-copy">
          <span className="k-mark">{field('hero-kicker')}</span>
          <h1>{field('hero-title', { as: 'span' })}</h1>
          <p>{field('hero-sub', { as: 'span', multiline: true })}</p>
          <div className="home-v2-actions">
            <Link href="/chronometer" className="home-v2-primary">Request entry</Link>
            <Link href="/tools" className="home-v2-secondary">Member command →</Link>
          </div>
        </div>

        <RealmShield3D />

        <aside className="home-v2-signal">
          <div className="home-v2-signal-head"><span>KINGDOM SIGNAL</span><b>● LIVE</b></div>
          <article><small>STATUS</small><strong>KVK MODE</strong><p>Preparation, growth and coordination in motion.</p></article>
          <article><small>ALLIANCES</small><strong>03 ACTIVE</strong><p>710 · RED · SKY</p></article>
          <article><small>MEMBER ACCESS</small><strong>TOOLS LIVE</strong><p>Forms, power data, events and optimizers.</p></article>
        </aside>
      </section>

      <section className="home-v2-strip">
        <div><span>01</span><b>THE REALM</b><p>History, culture and what makes 710 worth joining.</p></div>
        <div><span>02</span><b>THE WAR ROOM</b><p>Operational routes without turning the homepage into a dashboard.</p></div>
        <div><span>03</span><b>THE FORGE</b><p>The shield identity continues beyond the loader and into the kingdom.</p></div>
      </section>

      <section className="home-v2-command">
        <div className="home-v2-command-copy">
          <span className="k-mark">{field('deck-head-kicker')}</span>
          <h2>{field('deck-head-title')}</h2>
          <p>{field('deck-head-sub', { multiline: true })}</p>
        </div>
        <div className="home-v2-command-list">
          {COMMAND.map((item) => (
            <Link key={item.href} href={item.href}><b>{item.n}</b><span><strong>{item.title}</strong><small>{item.sub}</small></span><i>↗</i></Link>
          ))}
        </div>
      </section>

      <section className="home-v2-story">
        <div className="home-v2-story-scene"><div className="home-v2-story-sun"/><div className="home-v2-story-castle"/></div>
        <div className="home-v2-story-copy">
          <span className="k-mark">{field('why-head-kicker')}</span>
          <h2>{field('why-head-title')}</h2>
          <p>{field('why-head-sub', { multiline: true })}</p>
          <div className="home-v2-doctrine">
            {DOCTRINE.map((d) => <div key={d.n}><b>{d.n}</b><span><strong>{field(d.titleKey)}</strong><small>{field(d.bodyKey, { multiline: true })}</small></span></div>)}
          </div>
          <Link href="/about" className="home-v2-story-link">Read the kingdom story →</Link>
        </div>
      </section>

      <section className="home-v2-alliances">
        <span className="k-mark">{field('wb-head-kicker')}</span>
        <h2>{field('wb-head-title')}</h2>
        <div className="home-v2-alliance-line">
          {ALLIANCES.map((a, index) => (
            <div className="home-v2-alliance-fragment" key={a.band}>
              {index > 0 && <i />}
              <Link href={`/alliances/${a.band.toLowerCase()}`}><b>{a.band}</b><small>{field(a.nameKey)}</small><em>{field(a.descKey, { multiline: true })}</em></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="home-v2-final">
        <div><span className="k-mark">THE GATE IS OPEN</span><h2>Come in as a player.<br/>Stay because it works.</h2></div>
        <Link href="/chronometer">Start transfer path</Link>
      </section>
    </main>
  );
}
