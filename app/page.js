import Link from 'next/link';
import HomeEditableText from '../components/HomeEditableText';
import { getHomeContent, checkIsAdmin } from '../lib/homeContent';

export const metadata = {
  title: 'K710 Dashboard',
};

// Homepage content is stored in the content_blocks table (page = 'home') and
// is editable inline by a logged-in admin only. Missing fields self-seed on
// first render, so no manual setup is needed.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const content = await getHomeContent();
  const isAdmin = await checkIsAdmin();

  // Helper to render an editable text field by its key.
  const field = (key, props = {}) => {
    const c = content[key] || { id: null, text: '' };
    return (
      <HomeEditableText
        id={c.id}
        fieldKey={key}
        initialText={c.text}
        isAdmin={isAdmin}
        {...props}
      />
    );
  };

  return (
    <main className="k710-page">
      {/* HERO */}
      <div className="hero">
        <svg className="hero-crest" viewBox="0 0 200 200" fill="none">
          <path d="M100 10 L175 35 V95 C175 140 145 170 100 190 C55 170 25 140 25 95 V35 Z" stroke="#d9a94e" strokeWidth="2" />
          <path d="M100 30 L155 48 V96 C155 130 132 154 100 168 C68 154 45 130 45 96 V48 Z" stroke="#d9a94e" strokeWidth="1" />
          <text x="100" y="112" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="46" fill="#d9a94e">710</text>
        </svg>
        <div className="wrap">
          <div className="hero-inner">
            <div className="eyebrow">KINGDOM 710 &middot; KINGSHOT</div>
            <h1>Rebuild the realm.<br />Rule the <em>server</em>.</h1>
            <p className="sub">
              710 is a KvK-first kingdom run across three coordinated warbands, with
              Bear Hunt coverage spanning every timezone and war-room tooling most
              kingdoms never bother building. If you&rsquo;re shopping for your next server,
              start here.
            </p>
            <div className="hero-ctas">
              <Link href="/interest" className="btn btn-primary">Apply to Transfer &nbsp;&rarr;</Link>
              <Link href="/player-record" className="btn btn-ghost">I&rsquo;m already in 710</Link>
            </div>
            <div className="stat-row">
              <div className="stat"><span className="num">3</span><span className="label">Warbands, one kingdom</span></div>
              <div className="stat"><span className="num">7</span><span className="label">Bear Hunt windows / day</span></div>
              <div className="stat"><span className="num">Monthly</span><span className="label">Intake windows open</span></div>
            </div>
          </div>
        </div>
        <svg className="torn" viewBox="0 0 1200 34" preserveAspectRatio="none">
          <path d="M0 34 L0 18 L40 26 L80 10 L120 22 L160 6 L200 20 L240 12 L280 24 L320 8 L360 20 L400 14 L440 26 L480 10 L520 22 L560 6 L600 20 L640 12 L680 24 L720 8 L760 20 L800 14 L840 26 L880 10 L920 22 L960 6 L1000 20 L1040 12 L1080 24 L1120 8 L1160 20 L1200 14 L1200 34 Z" fill="#1a2140" />
        </svg>
      </div>

      {/* WHY 710 */}
      <div className="section section-alt">
        <div className="wrap">
          <div className="section-head">
            {field('why-head-kicker', { as: 'div', className: 'eyebrow' })}
            {field('why-head-title', { as: 'h2' })}
            {field('why-head-sub', { as: 'p', multiline: true })}
          </div>
          <div className="grid-3">
            <div className="card">
              <svg className="card-icon" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="14" stroke="#d9a94e" strokeWidth="1.6" /><path d="M17 9V17L22 20" stroke="#d9a94e" strokeWidth="1.6" strokeLinecap="round" /></svg>
              {field('why-1-title', { as: 'h3' })}
              {field('why-1-body', { as: 'p', multiline: true })}
            </div>
            <div className="card">
              <svg className="card-icon" viewBox="0 0 34 34" fill="none"><path d="M17 4 L28 9 V17 C28 24 23 28.5 17 31 C11 28.5 6 24 6 17 V9 Z" stroke="#d9a94e" strokeWidth="1.6" /></svg>
              {field('why-2-title', { as: 'h3' })}
              {field('why-2-body', { as: 'p', multiline: true })}
            </div>
            <div className="card">
              <svg className="card-icon" viewBox="0 0 34 34" fill="none"><rect x="5" y="5" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /><rect x="19" y="5" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /><rect x="5" y="19" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /><rect x="19" y="19" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /></svg>
              {field('why-3-title', { as: 'h3' })}
              {field('why-3-body', { as: 'p', multiline: true })}
            </div>
          </div>
        </div>
      </div>

      {/* WARBANDS */}
      <div className="section">
        <div className="wrap">
          <div className="section-head">
            {field('wb-head-kicker', { as: 'div', className: 'eyebrow' })}
            {field('wb-head-title', { as: 'h2' })}
            {field('wb-head-sub', { as: 'p', multiline: true })}
          </div>
          <div className="grid-3">
            <div className="warband-card" style={{ '--band-color': '#d9a94e' }}>
              <span className="wb-tag">Home Warband</span>
              <div className="wb-name"><span className="wb-dot"></span>{field('wb-1-name')}</div>
              {field('wb-1-desc', { as: 'p', className: 'wb-desc', multiline: true })}
              <div className="wb-times">
                <span className="wb-time">0200 UTC</span>
                <span className="wb-time">1300 UTC</span>
              </div>
            </div>
            <div className="warband-card" style={{ '--band-color': '#d9622d' }}>
              <div className="wb-name"><span className="wb-dot"></span>{field('wb-2-name')}</div>
              {field('wb-2-desc', { as: 'p', className: 'wb-desc', multiline: true })}
              <div className="wb-times">
                <span className="wb-time">1105 UTC</span>
                <span className="wb-time">1900 UTC</span>
                <span className="wb-time">2320 UTC</span>
              </div>
            </div>
            <div className="warband-card" style={{ '--band-color': '#86a873' }}>
              <div className="wb-name"><span className="wb-dot"></span>{field('wb-3-name')}</div>
              {field('wb-3-desc', { as: 'p', className: 'wb-desc', multiline: true })}
              <div className="wb-times">
                <span className="wb-time">1200 UTC</span>
                <span className="wb-time">2000 UTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PATH TO JOINING */}
      <div className="section section-alt">
        <div className="wrap">
          <div className="section-head">
            {field('steps-head-kicker', { as: 'div', className: 'eyebrow' })}
            {field('steps-head-title', { as: 'h2' })}
            {field('steps-head-sub', { as: 'p', multiline: true })}
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              {field('step-1-title', { as: 'h4' })}
              {field('step-1-body', { as: 'p', multiline: true })}
            </div>
            <div className="step">
              <span className="step-num">02</span>
              {field('step-2-title', { as: 'h4' })}
              {field('step-2-body', { as: 'p', multiline: true })}
            </div>
            <div className="step">
              <span className="step-num">03</span>
              {field('step-3-title', { as: 'h4' })}
              {field('step-3-body', { as: 'p', multiline: true })}
            </div>
            <div className="step">
              <span className="step-num">04</span>
              {field('step-4-title', { as: 'h4' })}
              {field('step-4-body', { as: 'p', multiline: true })}
            </div>
          </div>
          <div style={{ marginTop: '44px' }}>
            <Link href="/interest" className="btn btn-primary">Start Your Application &nbsp;&rarr;</Link>
          </div>
        </div>
      </div>

      {/* COMMAND DECK */}
      <div className="section">
        <div className="wrap">
          <div className="section-head">
            {field('deck-head-kicker', { as: 'div', className: 'eyebrow' })}
            {field('deck-head-title', { as: 'h2' })}
            {field('deck-head-sub', { as: 'p', multiline: true })}
          </div>
          <div className="deck">
            <Link className="deck-tile" href="/player-record">
              <span>{field('deck-1-label', { className: 'dt-label' })}{field('deck-1-sub', { className: 'dt-sub' })}</span>
              <span className="dt-arrow">&rarr;</span>
            </Link>
            <Link className="deck-tile" href="/power-profile">
              <span>{field('deck-2-label', { className: 'dt-label' })}{field('deck-2-sub', { className: 'dt-sub' })}</span>
              <span className="dt-arrow">&rarr;</span>
            </Link>
            <Link className="deck-tile" href="/admin">
              <span>{field('deck-3-label', { className: 'dt-label' })}{field('deck-3-sub', { className: 'dt-sub' })}</span>
              <span className="dt-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* EVENTS TEASER */}
      <div className="section section-alt" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="events-card">
            <div>
              {field('events-title', { as: 'h3' })}
              {field('events-body', { as: 'p', multiline: true })}
            </div>
            <span className="events-badge">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="wrap">
        <div className="home-footer">
          <div className="fmark">
            <svg viewBox="0 0 40 40" fill="none"><path d="M20 3 L35 8 V19 C35 28 29 34 20 37 C11 34 5 28 5 19 V8 Z" stroke="#7c85a8" strokeWidth="1.6" /></svg>
            <span className="fname">K710 Alliance &middot; Kingshot KvK Tracker</span>
          </div>
          <div className="flinks">
            <Link href="/">Home</Link>
            <Link href="/player-record">Rallies</Link>
            <Link href="/interest">Interest</Link>
            <Link href="/power-profile">Power Profile</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
