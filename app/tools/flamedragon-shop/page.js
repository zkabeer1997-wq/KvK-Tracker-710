import Link from 'next/link';
import FlamedragonShopOptimizer from '../FlamedragonShopOptimizer';

export const metadata = {
  title: 'Flamedragon Tyrant Shop Optimizer | K710',
  description: 'Build a Dragon’s Caravan reward cart and find the cheapest Dragon Essence pack combination to buy it, plus a value guide for every shop item.',
};

export default function FlamedragonShopPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';
  return <main className="armory ft-shop-page">
    <div className="armory-atmos" aria-hidden="true"/><span className="armory-rack-l" aria-hidden="true"/><span className="armory-rack-r" aria-hidden="true"/>
    <div className="armory-inner ft-shop-inner">
      <div className="ft-shop-nav"><Link href={`/tools${query}`}>← Tools &amp; Calculators</Link><span className="k-mark">Special Event Shops</span></div>
      <header className="armory-head ft-shop-head"><h1 className="k-display armory-title">Flamedragon Tyrant</h1><p className="k-narrative armory-lede">Prioritize the Dragon’s Caravan rewards you want and find the lowest-cost legal pack combination.</p></header>

      <section className="tool-explainer">
        <h2>How the Flamedragon Tyrant shop works</h2>
        <p>
          The Flamedragon Tyrant event shop sells 16 reward items for Dragon Essence, from hero shards and
          gear chests up to Truegold and Mithril. Every item is priced in Essence, and Essence itself is bought
          in six pack sizes ranging from a $4.99 / 200-Essence pack up to a $99.99 / 4,000-Essence pack, plus a
          once-per-day $4.99 / 300-Essence Caravan pack. Not every item is worth the Essence it costs — the
          shop&apos;s own pricing puts <strong>Mithril at 80% and Truegold at 84%</strong> of what a comparable
          special-offer pack charges for the same reward (the best value in the shop), while
          <strong> Advanced Pet Refinement sits at 240%</strong> (the worst).
        </p>
        <h2>How the optimizer works</h2>
        <p>
          Build a reward cart from the items you actually want, and the calculator totals the Essence required,
          then solves for the cheapest combination of the six pack sizes that covers it — minimizing cash cost
          first, then leftover Essence, then the number of packs bought. For example, needing 1,000 Essence with
          none already owned, the planner selects <strong>five 200-Essence packs ($4.99 each) for $24.95 total
          with zero Essence left over</strong> — the 200-Essence pack has the lowest cost per Essence of the six
          sizes, so it wins over combinations using the larger packs.
        </p>
      </section>

      <FlamedragonShopOptimizer/>
    </div>
    <style>{`
      .ft-shop-page{color:var(--parchment)}
      .ft-shop-inner{width:min(1440px,100%);padding-top:clamp(76px,9vh,108px)}
      .ft-shop-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
      .ft-shop-nav a{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
      .ft-shop-nav a:hover{color:var(--gold-hot)}
      .ft-shop-head{margin-bottom:24px}
      .tool-explainer{max-width:74ch;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--edge)}
      .tool-explainer h2{font:600 15px/1 var(--font-display);letter-spacing:.05em;color:var(--parchment);margin:20px 0 8px}
      .tool-explainer h2:first-child{margin-top:0}
      .tool-explainer p{margin:0 0 6px;color:var(--parchment-dim);font-size:13.5px;line-height:1.7}
      .tool-explainer strong{color:var(--gold-hot)}
      @media(max-width:620px){.ft-shop-nav{align-items:flex-start;flex-direction:column}.ft-shop-inner{padding-top:70px}}
    `}</style>
  </main>;
}
