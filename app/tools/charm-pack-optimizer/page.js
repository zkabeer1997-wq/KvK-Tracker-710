import Link from 'next/link';
import CharmPackOptimizer from '../CharmPackOptimizer';
import { toolSoftwareApplicationJsonLd } from '../../../lib/toolJsonLd';

export const metadata = {
  title: 'Charm Pack Optimizer',
  description: 'Plan all 18 Governor Charm upgrades and find the cheapest weekly pack schedule to hit your target levels.',
  alternates: { canonical: '/tools/charm-pack-optimizer' },
};

const jsonLd = toolSoftwareApplicationJsonLd({
  name: 'Charm Pack Optimizer',
  description: 'Plan all 18 Governor Charm upgrades and find the cheapest weekly pack schedule to hit your target levels.',
  path: '/tools/charm-pack-optimizer',
});

export default function CharmPackOptimizerPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';

  return (
    <main className="armory charm-pack-page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="armory-atmos" aria-hidden="true" /><span className="armory-rack-l" aria-hidden="true" /><span className="armory-rack-r" aria-hidden="true" />
      <div className="armory-inner charm-pack-inner">
        <div className="charm-pack-nav"><Link href={`/tools${query}`}>← Tools &amp; Calculators</Link><span className="k-mark">Governor Charms</span></div>
        <header className="armory-head charm-pack-head">
          <h1 className="k-display armory-title">Charm Pack Optimizer</h1>
          <p className="k-narrative armory-lede">Plan all 18 Governor Charm upgrades and forge the fastest, lowest-cost weekly pack schedule.</p>
        </header>

        <section className="tool-explainer">
          <h2>How Governor Charms work</h2>
          <p>
            Governor Charms cover three troop types — Infantry, Cavalry, and Archer — with six charm slots each,
            for 18 charms total. Every charm levels from 0 to 22 independently, and each level costs a fixed
            amount of Charm Guides and Charm Designs. The cost climbs steeply: level 1 costs 5 Guides and 5
            Designs, level 10 costs 420 and 420, and level 22 costs 1,105 Guides and 2,400 Designs on its own.
            Taking one charm from level 0 to level 10 costs <strong>1,465 Guides and 2,280 Designs</strong> in
            total — across all 18 charms at once, that&apos;s <strong>26,370 Guides and 41,040 Designs</strong>.
          </p>
          <h2>How the optimizer works</h2>
          <p>
            Weekly Charm packs sell Guides and Designs at a fixed 10:11 ratio — a $4.99 pack holds 20 Guides
            or 22 Designs (in any combination across its purchase slots), scaling up to a $99.99 pack holding
            400 Guides or 440 Designs. Given your current and target levels for all 18 charms, the calculator
            searches week-by-week for the smallest number of weeks in which some combination of packs — bounded
            by each pack&apos;s weekly purchase limit — can cover every remaining Guide and Design, then works out
            exactly which purchase slots should go to Guides versus Designs to hit both totals at once.
          </p>
        </section>

        <CharmPackOptimizer />
      </div>
      <style>{`
        .charm-pack-page{color:var(--parchment)}
        .charm-pack-inner{width:min(1440px,100%);padding-top:clamp(76px,9vh,108px)}
        .charm-pack-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
        .charm-pack-nav a{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
        .charm-pack-nav a:hover{color:var(--gold-hot)}
        .charm-pack-head{margin-bottom:24px}
        .tool-explainer{max-width:74ch;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--edge)}
        .tool-explainer h2{font:600 15px/1 var(--font-display);letter-spacing:.05em;color:var(--parchment);margin:20px 0 8px}
        .tool-explainer h2:first-child{margin-top:0}
        .tool-explainer p{margin:0 0 6px;color:var(--parchment-dim);font-size:13.5px;line-height:1.7}
        .tool-explainer strong{color:var(--gold-hot)}
        @media(max-width:620px){.charm-pack-nav{align-items:flex-start;flex-direction:column}.charm-pack-inner{padding-top:70px}}
      `}</style>
    </main>
  );
}
