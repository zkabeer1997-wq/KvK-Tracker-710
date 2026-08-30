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
  { n: '01', href: '/events', title: 'Events', sub: 'See what is happening and when' },
  { n: '02', href: '/guides', title: 'Guides', sub: 'Kingdom strategy, explained clearly' },
  { n: '03', href: '/tools', title: 'Tools', sub: 'Plan upgrades before you spend' },
  { n: '04', href: '/power-profile', title: 'Power Profile', sub: 'Keep your player details up to date' },
];

// Replace only the older promotional copy. If an admin writes something new,
// their version wins automatically because it no longer matches these strings.
const COPY_REWRITES = {
  'hero-kicker': {
    from: ['KINGDOM 710 · KINGSHOT'],
    to: 'Kingdom 710',
  },
  'hero-title': {
    from: ['Rebuild the realm. Rule the server.', 'Welcome to the Hub of Kingdom 710!'],
    to: 'Play hard. Stay for the people.',
  },
  'hero-sub': {
    from: [
      "710 is a KvK-first kingdom run across three coordinated alliances, with Bear Hunt coverage spanning every timezone and war-room tooling most kingdoms never bother building. If you're shopping for your next server, start here.",
      "710 is a KvK-first kingdom run across three coordinated alliances, with Bear Hunt coverage spanning every timezone and war-room tooling most kingdoms never bother building. If you're looking for your next server, start here.",
    ],
    to: '710 is home to three alliances and players across every time zone. We show up for KvK, help each other grow, and keep the game fun.',
  },
  'deck-head-kicker': {
    from: ['ALREADY IN 710?'],
    to: 'For members',
  },
  'deck-head-title': {
    from: ['Command deck', 'Rally Joiners and Leads'],
    to: 'Everything 710 uses',
  },
  'deck-head-sub': {
    from: ['Quick access to the tools your alliance uses every KvK cycle.'],
    to: 'Open your profile, event schedule, guides, and upgrade tools.',
  },
  'why-head-kicker': {
    from: ['WHY GOVERN WITH US'],
    to: 'What 710 is like',
  },
  'why-head-title': {
    from: ['Built for players who take KvK seriously', 'Built for players who take Kingshot seriously (mostly)'],
    to: 'Competitive when it matters. Relaxed the rest of the time.',
  },
  'why-head-sub': {
    from: [
      "Not another spreadsheet-and-hope operation. Here's what's actually different about how 710 runs.",
      "Not another spreadsheet-and-hope kingdom. Here's what's actually different about how 710 runs.",
    ],
    to: 'We want active players, good teammates, and a kingdom people actually enjoy logging into.',
  },
  'why-1-title': {
    from: ['Coverage in every timezone'],
    to: 'Someone is always online',
  },
  'why-1-body': {
    from: [
      'Three alliances, seven Bear Hunt windows spread across the clock. Whenever you log in, somebody in 710 is already rallying.',
      'Three Alliances, seven Bear Hunt times spread across the world. Whenever you log in, somebody in 710 is already rallying.',
    ],
    to: 'Seven Bear Hunt times across 710, RED, and SKY make it easier to find a schedule that works for you.',
  },
  'why-2-title': {
    from: ['Vetted for commitment, not just power'],
    to: 'Activity matters more than a power number',
  },
  'why-2-body': {
    from: ['Our transfer review looks at T11 troop levels, Mystic Trial stages, and KvK-prep habits — because a kingdom of quiet whales loses to a kingdom that shows up.'],
    to: 'We look for players who join events, prepare for KvK, and help their alliance. Big accounts are useful; reliable teammates are better.',
  },
  'why-3-title': {
    from: ['Real war-room tooling'],
    to: 'Useful tools for members',
  },
  'why-3-body': {
    from: ['Rally roster tracking, King Skill scheduling, and live power profiles — purpose-built for this kingdom, not a shared Google Sheet from three seasons ago.'],
    to: 'Update your power profile, plan upgrades, check event times, and complete KvK forms without digging through old messages.',
  },
  'wb-head-kicker': {
    from: ['THE THREE ALLIANCES'],
    to: 'Find your alliance',
  },
  'wb-head-title': {
    from: ['Pick your alliance, know your hunt times', 'Pick your alliance, find your hunt times'],
    to: 'Seven Bear Hunts. Three homes.',
  },
  'wb-head-sub': {
    from: ["Every alliance runs its own Bear Hunt schedule. Migration preference is part of the application — here's what each one covers."],
    to: 'Choose the alliance whose schedule and community fit you best. You can review every hunt time before you apply.',
  },
};

export default async function HomePage() {
  const content = await getHomeContent();
  const isAdmin = await checkIsAdmin();
  const field = (key, props = {}) => {
    const c = content[key] || { id: null, text: '' };
    const rewrite = COPY_REWRITES[key];
    const initialText = rewrite && rewrite.from.includes(c.text.trim()) ? rewrite.to : c.text;
    return <HomeEditableText id={c.id} fieldKey={key} initialText={initialText} isAdmin={isAdmin} {...props} />;
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
            <Link href="/chronometer" className="home-v2-primary">Apply to join 710</Link>
            <Link href="/tools" className="home-v2-secondary">Open member tools →</Link>
          </div>
        </div>

        <RealmShield3D />

        <aside className="home-v2-signal">
          <div className="home-v2-signal-head"><span>710 AT A GLANCE</span><b>● ONLINE</b></div>
          <article><small>CURRENT FOCUS</small><strong>KVK PREP</strong><p>Check the event schedule and prep priorities.</p></article>
          <article><small>ALLIANCES</small><strong>710 · RED · SKY</strong><p>Seven Bear Hunt times across three alliances.</p></article>
          <article><small>MEMBER AREA</small><strong>OPEN</strong><p>Profiles, forms, guides, and calculators.</p></article>
        </aside>
      </section>

      <section className="home-v2-strip">
        <div><span>01</span><b>NEW TO 710?</b><p>Meet the alliances and see whether the kingdom fits you.</p></div>
        <div><span>02</span><b>ALREADY A MEMBER?</b><p>Update your profile, submit availability, and check event times.</p></div>
        <div><span>03</span><b>PLANNING UPGRADES?</b><p>Use the calculators before you spend items or money.</p></div>
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
          <Link href="/about" className="home-v2-story-link">More about 710 →</Link>
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
        <div><span className="k-mark">READY TO MOVE?</span><h2>Find the alliance and schedule<br/>that fit you.</h2></div>
        <Link href="/chronometer">Apply to join 710</Link>
      </section>
    </main>
  );
}
