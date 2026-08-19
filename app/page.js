import Link from 'next/link';
import HomeEditableText from '../components/HomeEditableText';
import { getHomeContent, checkIsAdmin } from '../lib/homeContent';
import KingdomEntrance from '../components/kingdom/KingdomEntrance';

export const metadata = {
  // Absolute so the homepage isn't "K710 Hub · K710 Hub".
  title: { absolute: 'K710 Hub · Kingdom 710' },
};

// Homepage content is stored in the content_blocks table (page = 'home') and
// is editable inline by a logged-in admin only. Missing fields self-seed on
// first render, so no manual setup is needed.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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
      {/* KINGDOM GATE — 3D entrance experience */}
      <KingdomEntrance />

      {/* KINGDOM DOSSIER — the informational content, unlocked below the gate */}
      <div id="dossier" className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap kingdom-dossier-lead">
          {field('hero-kicker', { as: 'div', className: 'eyebrow' })}
          {field('hero-title', { as: 'h2' })}
          {field('hero-sub', { as: 'p', className: 'sub', multiline: true })}
          <div className="hero-ctas" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link href="/interest" className="btn btn-primary">Apply to Transfer &nbsp;&rarr;</Link>
            <Link href="/player-record" className="btn btn-ghost">I&rsquo;m already in 710</Link>
          </div>
          <div className="stat-row" style={{ margin: '32px auto 0' }}>
            <div className="stat"><span className="num">3</span><span className="label">Warbands, one kingdom</span></div>
            <div className="stat"><span className="num">7</span><span className="label">Bear Hunt windows / day</span></div>
            <div className="stat"><span className="num">Monthly</span><span className="label">Intake windows open</span></div>
          </div>
        </div>
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
