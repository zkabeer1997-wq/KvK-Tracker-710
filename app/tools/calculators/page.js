import Link from 'next/link';
import CalculatorSuite from './CalculatorSuite';

export const metadata = {
  title: 'Kingshot Progression Calculators | K710',
  description: 'Kingshot progression calculators for Governor Gear, Charms, heroes, troop training, Hero Gear, Forgehammers, and VIP planning.',
};

export default function CalculatorsPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';

  return (
    <main className="armory calculator-library-page">
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l" aria-hidden="true" />
      <span className="armory-rack-r" aria-hidden="true" />

      <div className="armory-inner calculator-library-inner">
        <div className="calculator-library-nav">
          <Link href={`/tools${query}`} className="calculator-library-back">← Tools &amp; Calculators</Link>
          <span className="k-mark">Kingdom 710 Workshop</span>
        </div>

        <header className="armory-head calculator-library-head">
          <h1 className="k-display armory-title">Progression Calculators</h1>
          <p className="k-narrative armory-lede">
            Cost, time, material, shortfall, and event-point math for common Kingshot progression systems — without upgrade recommendations or optimizer logic.
          </p>
        </header>

        <CalculatorSuite />
      </div>

      <style>{`
        .calculator-library-page{color:var(--parchment);min-height:100vh}
        .calculator-library-inner{width:min(1320px,100%);padding-top:clamp(76px,9vh,108px)}
        .calculator-library-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
        .calculator-library-back{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
        .calculator-library-back:hover{color:var(--gold-hot)}
        .calculator-library-head{max-width:920px;margin-bottom:28px}
        @media(max-width:620px){.calculator-library-nav{align-items:flex-start;flex-direction:column}.calculator-library-inner{padding-top:70px}}
      `}</style>
    </main>
  );
}
