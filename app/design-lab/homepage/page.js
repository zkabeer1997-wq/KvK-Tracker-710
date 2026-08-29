import Link from 'next/link';
import styles from './homepage-lab.module.css';

export const metadata = {
  title: 'Homepage Design Lab · K710 Hub',
  description: 'Internal homepage direction studies for K710 Hub.',
  robots: { index: false, follow: false },
};

const ConceptNav = () => (
  <nav className={styles.labNav} aria-label="Homepage design concepts">
    <Link href="#chronicle">01 Chronicle</Link>
    <Link href="#citadel">02 Citadel</Link>
    <Link href="#march">03 March Table</Link>
  </nav>
);

const EmberMark = ({ children }) => <span className={styles.emberMark}>{children}</span>;

export default function HomepageDesignLab() {
  return (
    <main className={styles.lab}>
      <header className={styles.labHeader}>
        <div>
          <span className={styles.labKicker}>K710 · internal design lab</span>
          <h1>Three directions for the front door.</h1>
          <p>
            These are structural studies, not production replacements. Each keeps the kingdom identity while testing a different bridge between cinematic Realm and useful Console.
          </p>
        </div>
        <ConceptNav />
      </header>

      <section id="chronicle" className={`${styles.concept} ${styles.chronicle}`}>
        <div className={styles.conceptLabel}>
          <span>01</span>
          <div>
            <strong>The Chronicle</strong>
            <small>Editorial Realm · recommended public direction</small>
          </div>
        </div>

        <div className={styles.chronicleHero}>
          <div className={styles.sunDisc} aria-hidden="true" />
          <div className={styles.chronicleCopy}>
            <EmberMark>Kingdom 710 · KvK-first</EmberMark>
            <h2>Three alliances.<br />One kingdom.</h2>
            <p>
              Built for players who want organized wars, reliable event coverage, and a kingdom that treats preparation like part of the fight.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryWarm} href="/chronometer">Approach the registry</Link>
              <Link className={styles.textAction} href="/about">Read our story <span>↗</span></Link>
            </div>
          </div>
          <aside className={styles.fieldNote}>
            <span className={styles.fieldNo}>710</span>
            <p>Kingdom record</p>
            <dl>
              <div><dt>Alliances</dt><dd>710 · RED · SKY</dd></div>
              <div><dt>Doctrine</dt><dd>Preparation wins wars</dd></div>
              <div><dt>Coverage</dt><dd>Multi-timezone</dd></div>
            </dl>
          </aside>
        </div>

        <div className={styles.chronicleBody}>
          <article className={styles.statement}>
            <span>Our doctrine</span>
            <h3>We organize before the battlefield asks us to.</h3>
            <p>
              Instead of three equal cards, the kingdom philosophy becomes one memorable statement supported by a numbered campaign ledger.
            </p>
          </article>
          <ol className={styles.doctrineLedger}>
            <li><span>I</span><div><strong>Show up prepared.</strong><p>Growth, gear and coordination happen before the countdown reaches zero.</p></div></li>
            <li><span>II</span><div><strong>Move as one.</strong><p>Three alliances share one operating picture when the kingdom is on the line.</p></div></li>
            <li><span>III</span><div><strong>Make the kingdom useful.</strong><p>Schedules, tools and records live in one place instead of scattered chats.</p></div></li>
          </ol>
        </div>

        <div className={styles.allianceRibbon} aria-label="K710 alliances">
          <div><b>710</b><span>Kingdom core</span></div>
          <div><b>RED</b><span>Redemption</span></div>
          <div><b>SKY</b><span>Coordinated wing</span></div>
          <Link href="/chronometer">View hunt windows →</Link>
        </div>
      </section>

      <section id="citadel" className={`${styles.concept} ${styles.citadel}`}>
        <div className={styles.conceptLabelDark}>
          <span>02</span>
          <div>
            <strong>The Citadel</strong>
            <small>Cinematic Bridge · strongest continuation of the gate</small>
          </div>
        </div>

        <div className={styles.citadelScene}>
          <div className={styles.gateSilhouette} aria-hidden="true">
            <i className={styles.towerLeft} />
            <i className={styles.gateArch} />
            <i className={styles.towerRight} />
          </div>
          <div className={styles.citadelGlow} aria-hidden="true" />
          <div className={styles.citadelHeroCopy}>
            <span className={styles.goldEyebrow}>ENTER KINGDOM 710</span>
            <h2>Built to fight<br />as one kingdom.</h2>
            <p>War-room discipline outside. Kingdom atmosphere at the threshold.</p>
            <div className={styles.actions}>
              <Link className={styles.goldButton} href="/chronometer">Join K710</Link>
              <Link className={styles.ghostDark} href="/player-record">Member entry</Link>
            </div>
          </div>
          <div className={styles.statusRail}>
            <span className={styles.statusTitle}>KINGDOM SIGNAL</span>
            <div><small>WAR BANDS</small><strong>03</strong></div>
            <div><small>OPERATING MODE</small><strong>KVK</strong></div>
            <div><small>MEMBER TOOLS</small><strong>LIVE</strong></div>
          </div>
        </div>

        <div className={styles.citadelDeck}>
          <div className={styles.deckLead}>
            <span>Command deck</span>
            <h3>Get where you need to go.</h3>
            <p>The homepage becomes a gateway, not a brochure. Member tasks sit immediately under the cinematic hero.</p>
          </div>
          <Link href="/forms" className={styles.deckRow}><b>01</b><span><strong>Kingdom forms</strong><small>Applications and operational submissions</small></span><i>↗</i></Link>
          <Link href="/power-profile" className={styles.deckRow}><b>02</b><span><strong>Power profile</strong><small>Review and manage player strength data</small></span><i>↗</i></Link>
          <Link href="/tools" className={styles.deckRow}><b>03</b><span><strong>Tools</strong><small>Optimizers, calculators and event utilities</small></span><i>↗</i></Link>
        </div>
      </section>

      <section id="march" className={`${styles.concept} ${styles.march}`}>
        <div className={styles.conceptLabel}>
          <span>03</span>
          <div>
            <strong>The March Table</strong>
            <small>Realm × Console · strongest utility-first hybrid</small>
          </div>
        </div>

        <div className={styles.marchGrid}>
          <article className={styles.marchHero}>
            <span className={styles.marchKicker}>THE KINGDOM TABLE · 710</span>
            <h2>Know the kingdom.<br />Know the next move.</h2>
            <p>A homepage designed like a campaign table: identity, current priorities and direct routes into the hub coexist in a single composition.</p>
            <Link className={styles.inkButton} href="/chronometer">Enter the kingdom</Link>
          </article>

          <aside className={styles.marchBrief}>
            <span>Today in K710</span>
            <div className={styles.briefItem}><b>01</b><p><strong>Bear Hunt coverage</strong><small>Multiple alliance windows across the day</small></p></div>
            <div className={styles.briefItem}><b>02</b><p><strong>Transfer registry</strong><small>Review requirements and submit interest</small></p></div>
            <div className={styles.briefItem}><b>03</b><p><strong>Member operations</strong><small>Tools, records and event workflows</small></p></div>
          </aside>

          <div className={styles.mapField} aria-label="Stylized kingdom campaign map">
            <span className={styles.mapLabel}>K710 CAMPAIGN TABLE</span>
            <div className={`${styles.mapNode} ${styles.node710}`}><b>710</b><small>CORE</small></div>
            <div className={`${styles.mapNode} ${styles.nodeRed}`}><b>RED</b><small>WEST</small></div>
            <div className={`${styles.mapNode} ${styles.nodeSky}`}><b>SKY</b><small>EAST</small></div>
            <i className={styles.routeOne} /><i className={styles.routeTwo} />
          </div>

          <div className={styles.quickRoutes}>
            <Link href="/events"><span>Events</span><b>Campaign calendar →</b></Link>
            <Link href="/guides"><span>Guides</span><b>Kingdom doctrine →</b></Link>
            <Link href="/tools"><span>Tools</span><b>Open command tools →</b></Link>
          </div>
        </div>
      </section>

      <footer className={styles.labFooter}>
        <p><strong>Recommendation:</strong> use Chronicle as the public content language, Citadel as the hero/entry language, and borrow March Table patterns selectively for live/utility modules.</p>
        <Link href="/">Return to current homepage →</Link>
      </footer>
    </main>
  );
}
