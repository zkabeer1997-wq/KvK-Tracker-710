import Link from 'next/link';
import PetCalculator from './PetCalculator';

export const metadata = {
  title: 'Kingshot Pets Upgrade Calculator | K710',
  description: 'Calculate Pet Food, Growth Manuals, Nutrient Potions, and Promotion Medallions for Kingshot pet upgrades.',
};

export default function PetCalculatorPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';

  return (
    <main className="armory pet-calculator-page">
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l" aria-hidden="true" />
      <span className="armory-rack-r" aria-hidden="true" />
      <div className="armory-inner pet-calculator-inner">
        <div className="pet-calculator-nav">
          <Link href={`/tools${query}`} className="pet-calculator-back">← Tools &amp; Calculators</Link>
          <span className="k-mark">Kingdom 710 Workshop</span>
        </div>
        <PetCalculator />
      </div>
      <style>{`
        .pet-calculator-page{color:var(--parchment);min-height:100vh}
        .pet-calculator-inner{width:min(1180px,100%);padding-top:clamp(76px,9vh,108px)}
        .pet-calculator-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:28px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
        .pet-calculator-back{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
        .pet-calculator-back:hover{color:var(--gold-hot)}
        @media(max-width:620px){.pet-calculator-nav{align-items:flex-start;flex-direction:column}.pet-calculator-inner{padding-top:70px}}
      `}</style>
    </main>
  );
}
