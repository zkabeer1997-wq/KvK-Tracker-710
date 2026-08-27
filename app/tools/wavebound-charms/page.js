import Link from 'next/link';
import WaveboundCharmOptimizer from '../WaveboundCharmOptimizer';
import { toolSoftwareApplicationJsonLd } from '../../../lib/toolJsonLd';

export const metadata = {
  title: 'Wavebound Charm Merge Optimizer',
  description: 'Calculate the Tidal Treasure merges needed to reach a target Charm level, modeling the 75% Exquisite / 25% Majestic merge outcome.',
  alternates: { canonical: '/tools/wavebound-charms' },
};

const jsonLd = toolSoftwareApplicationJsonLd({
  name: 'Wavebound Charm Merge Optimizer',
  description: 'Calculate the Tidal Treasure merges needed to reach a target Charm level, modeling the 75% Exquisite / 25% Majestic merge outcome.',
  path: '/tools/wavebound-charms',
});

export default async function WaveboundCharmsPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';

  return (
    <main className="armory wavebound-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l" aria-hidden="true" />
      <span className="armory-rack-r" aria-hidden="true" />

      <div className="armory-inner wavebound-tool-inner">
        <div className="wavebound-tool-nav">
          <Link href={`/tools${query}`} className="wavebound-back">← Tools &amp; Calculators</Link>
          <span className="k-mark">Wavebound Voyage</span>
        </div>

        <header className="armory-head wavebound-tool-head">
          <h1 className="k-display armory-title">Charm Merge Optimizer</h1>
          <p className="k-narrative armory-lede">Plan the Tidal Treasure merges needed to reach your target Charm level without wasting the material type you need most.</p>
        </header>

        <section className="tool-explainer">
          <h2>How Wavebound Voyage merging works</h2>
          <p>
            Tidal Treasure chests come in four tiers: Common, Premium, Exquisite, and Majestic. Merging 3 Common
            chests produces 1 Premium chest, and merging 3 Premium chests produces 1 high-tier chest — which
            resolves to <strong>75% Exquisite or 25% Majestic</strong>. Majestic results carry more Charm Guides
            and Designs than Exquisite ones, so a merge plan built around a small number of Premium merges is
            gambling on getting enough Majestic outcomes to hit your target. Charm level costs use the same
            table as the Charm Pack Optimizer — one charm from level 0 to 10 needs 1,465 Guides and 2,280
            Designs, before multiplying by however many charms you&apos;re upgrading at once.
          </p>
          <h2>How the optimizer works</h2>
          <p>
            Rather than assuming every Premium merge lands Majestic, the calculator treats each one as an
            independent 25%-chance event and computes the binomial probability of getting at least the number
            of Majestic results your plan needs. For each possible combination of Common-merges and
            Premium-merges, it checks whether that combination clears your chosen confidence threshold (50% up
            to a worst-case-guaranteed 100%), then recommends the smallest total merge count that does — so
            you&apos;re not over-merging chests you don&apos;t need to spend.
          </p>
        </section>

        <WaveboundCharmOptimizer />
      </div>

      <style>{`
        .wavebound-tool-page{color:var(--parchment)}
        .wavebound-tool-inner{width:min(1220px,100%);padding-top:clamp(76px,9vh,108px)}
        .wavebound-tool-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
        .wavebound-back{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
        .wavebound-back:hover{color:var(--gold-hot)}
        .wavebound-tool-head{margin-bottom:24px}
        .tool-explainer{max-width:74ch;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--edge)}
        .tool-explainer h2{font:600 15px/1 var(--font-display);letter-spacing:.05em;color:var(--parchment);margin:20px 0 8px}
        .tool-explainer h2:first-child{margin-top:0}
        .tool-explainer p{margin:0 0 6px;color:var(--parchment-dim);font-size:13.5px;line-height:1.7}
        .tool-explainer strong{color:var(--gold-hot)}
        @media(max-width:620px){.wavebound-tool-nav{align-items:flex-start;flex-direction:column}.wavebound-tool-inner{padding-top:70px}}
      `}</style>
    </main>
  );
}
