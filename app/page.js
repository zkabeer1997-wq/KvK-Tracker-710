import Link from 'next/link';

export const metadata = {
  title: 'K710 Dashboard',
};

export default function HomePage() {
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
            <div className="eyebrow">WHY GOVERN WITH US</div>
            <h2>Built for players who take KvK seriously</h2>
            <p>Not another spreadsheet-and-hope operation. Here&rsquo;s what&rsquo;s actually different about how 710 runs.</p>
          </div>
          <div className="grid-3">
            <div className="card">
              <svg className="card-icon" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="14" stroke="#d9a94e" strokeWidth="1.6" /><path d="M17 9V17L22 20" stroke="#d9a94e" strokeWidth="1.6" strokeLinecap="round" /></svg>
              <h3>Coverage in every timezone</h3>
              <p>Three warbands, seven Bear Hunt windows spread across the clock. Whenever you log in, somebody in 710 is already rallying.</p>
            </div>
            <div className="card">
              <svg className="card-icon" viewBox="0 0 34 34" fill="none"><path d="M17 4 L28 9 V17 C28 24 23 28.5 17 31 C11 28.5 6 24 6 17 V9 Z" stroke="#d9a94e" strokeWidth="1.6" /></svg>
              <h3>Vetted for commitment, not just power</h3>
              <p>Our transfer review looks at T11 troop levels, Mystic Trial stages, and KvK-prep habits &mdash; because a kingdom of quiet whales loses to a kingdom that shows up.</p>
            </div>
            <div className="card">
              <svg className="card-icon" viewBox="0 0 34 34" fill="none"><rect x="5" y="5" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /><rect x="19" y="5" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /><rect x="5" y="19" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /><rect x="19" y="19" width="10" height="10" stroke="#d9a94e" strokeWidth="1.6" /></svg>
              <h3>Real war-room tooling</h3>
              <p>Rally roster tracking, King Skill scheduling, and live power profiles &mdash; purpose-built for this kingdom, not a shared Google Sheet from three seasons ago.</p>
            </div>
          </div>
        </div>
      </div>

      {/* WARBANDS */}
      <div className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">THE THREE WARBANDS</div>
            <h2>Pick your alliance, know your hunt times</h2>
            <p>Every warband runs its own Bear Hunt schedule. Migration preference is part of the application &mdash; here&rsquo;s what each one covers.</p>
          </div>
          <div className="grid-3">
            <div className="warband-card" style={{ '--band-color': '#d9a94e' }}>
              <span className="wb-tag">Home Warband</span>
              <div className="wb-name"><span className="wb-dot"></span>710</div>
              <p className="wb-desc">Two hunts a day, anchoring the early and midday windows.</p>
              <div className="wb-times">
                <span className="wb-time">0200 UTC</span>
                <span className="wb-time">1300 UTC</span>
              </div>
            </div>
            <div className="warband-card" style={{ '--band-color': '#d9622d' }}>
              <div className="wb-name"><span className="wb-dot"></span>RED</div>
              <p className="wb-desc">Three hunts, running from EU evening through NA late night.</p>
              <div className="wb-times">
                <span className="wb-time">1105 UTC</span>
                <span className="wb-time">1900 UTC</span>
                <span className="wb-time">2320 UTC</span>
              </div>
            </div>
            <div className="warband-card" style={{ '--band-color': '#86a873' }}>
              <div className="wb-name"><span className="wb-dot"></span>SKY</div>
              <p className="wb-desc">Two hunts anchoring the SEA / AU daytime window.</p>
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
            <div className="eyebrow">HOW TRANSFERS WORK</div>
            <h2>Your path to the throne room</h2>
            <p>Four steps, start to finish. No guesswork about where your application stands.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              <h4>Submit the interest form</h4>
              <p>In-game name, player ID, Discord, and your current server and alliance.</p>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <h4>Get reviewed</h4>
              <p>Troop tier, T11 status, Mystic Trial stages, power, and honest commitment questions.</p>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <h4>Pick your intake window</h4>
              <p>New intake opens monthly &mdash; apply now, transfer when your window lands.</p>
            </div>
            <div className="step">
              <span className="step-num">04</span>
              <h4>March in, report to your warband</h4>
              <p>Land in 710, RED, or SKY and get looped into your warband&rsquo;s rally schedule.</p>
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
            <div className="eyebrow">ALREADY IN 710?</div>
            <h2>Command deck</h2>
            <p>Quick access to the tools your warband uses every KvK cycle.</p>
          </div>
          <div className="deck">
            <Link className="deck-tile" href="/player-record">
              <span><span className="dt-label">Rally Roster</span><span className="dt-sub">submit availability &amp; troops</span></span>
              <span className="dt-arrow">&rarr;</span>
            </Link>
            <Link className="deck-tile" href="/power-profile">
              <span><span className="dt-label">Power Profile</span><span className="dt-sub">track your growth</span></span>
              <span className="dt-arrow">&rarr;</span>
            </Link>
            <Link className="deck-tile" href="/admin">
              <span><span className="dt-label">Admin</span><span className="dt-sub">kingdom leadership only</span></span>
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
              <h3>Full kingdom event calendar</h3>
              <p>Bear Hunt windows above are live. The complete alliance event schedule &mdash; Sanctuaries, Castle, and KvK prep &mdash; is coming soon.</p>
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
