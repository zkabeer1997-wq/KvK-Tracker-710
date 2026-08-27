import Link from 'next/link';
import AdventureStallOptimizer from '../AdventureStallOptimizer';

export const metadata = {
  title: 'Adventure Stall Optimizer | K710',
  description: 'Build your Adventure Stall reward cart and find the lowest-cost Shell pack combination across the event days remaining.',
};

export default function AdventureStallPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';
  return <main className="armory as-page">
    <div className="armory-atmos" aria-hidden="true"/><span className="armory-rack-l" aria-hidden="true"/><span className="armory-rack-r" aria-hidden="true"/>
    <div className="armory-inner as-inner">
      <div className="as-nav"><Link href={`/tools${query}`}>← Tools &amp; Calculators</Link><span className="k-mark">Special Event Shops</span></div>
      <header className="armory-head as-head"><h1 className="k-display armory-title">Adventure Stall</h1><p className="k-narrative armory-lede">Build your reward cart and find the lowest-cost legal Shell pack combination across the event days remaining.</p></header>

      <section className="tool-explainer">
        <h2>How the Adventure Stall works</h2>
        <p>
          The Adventure Stall event shop sells 17 reward items for Shells, five of them featured items — True
          Gold, Hero Shards, limited Forgehammers, Mithril, and Mythic Hero Gear Chests — with tighter purchase
          caps than the rest of the shop. Shells themselves are bought in seven pack sizes from $0.99 for 20
          Shells up to $99.99 for 1,000 Shells. Every pack resets once per day, except the $99.99 / 1,000-Shell
          pack, which resets <strong>three times per day</strong>.
        </p>
        <h2>How the optimizer works</h2>
        <p>
          Build a reward cart and set how many purchase days remain, and the calculator totals the Shells
          required, then solves for the cheapest combination of pack purchases — bounded by each pack&apos;s daily
          limit times your remaining days — that covers it. For example, needing 60 Shells with a single day
          remaining, the planner combines <strong>a 40 Shell Pack ($1.99) and a 20 Shell Pack ($0.99) for $2.98
          total</strong>, rather than a single 80 Shell Pack ($4.99) that would leave 20 Shells unused — the
          smaller packs happen to have a better Shells-per-dollar rate at that exact target.
        </p>
      </section>

      <AdventureStallOptimizer/>
    </div>
    <style>{`
      .as-page{color:var(--parchment)}
      .as-inner{width:min(1440px,100%);padding-top:clamp(76px,9vh,108px)}
      .as-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
      .as-nav a{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
      .as-nav a:hover{color:var(--gold-hot)}
      .as-head{margin-bottom:24px}
      .tool-explainer{max-width:74ch;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--edge)}
      .tool-explainer h2{font:600 15px/1 var(--font-display);letter-spacing:.05em;color:var(--parchment);margin:20px 0 8px}
      .tool-explainer h2:first-child{margin-top:0}
      .tool-explainer p{margin:0 0 6px;color:var(--parchment-dim);font-size:13.5px;line-height:1.7}
      .tool-explainer strong{color:var(--gold-hot)}
      @media(max-width:620px){.as-nav{align-items:flex-start;flex-direction:column}.as-inner{padding-top:70px}}
    `}</style>
  </main>;
}
