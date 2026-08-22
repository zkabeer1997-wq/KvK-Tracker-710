import Link from 'next/link';
import KingdomPlanning from './KingdomPlanning';

export const metadata = {
  title: 'Kingshot Kingdom Planning Tools | K710',
  description: 'Rally launch timing and kingdom age milestone calculators for Kingshot.',
};

export default function KingdomPlanningPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';

  return (
    <main className="armory kingdom-planning-page">
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l" aria-hidden="true" />
      <span className="armory-rack-r" aria-hidden="true" />
      <div className="armory-inner kingdom-planning-inner">
        <div className="kingdom-planning-nav">
          <Link href={`/tools${query}`} className="kingdom-planning-back">← Tools &amp; Calculators</Link>
          <span className="k-mark">Kingdom 710 Command Tools</span>
        </div>
        <header className="armory-head kingdom-planning-head">
          <h1 className="k-display armory-title">Kingdom Planning Toolkit</h1>
          <p className="k-narrative armory-lede">Coordinate march launches and estimate kingdom timeline windows without strategy recommendations or automated upgrade optimization.</p>
        </header>
        <KingdomPlanning />
      </div>
      <style>{`
        .kingdom-planning-page{color:var(--parchment);min-height:100vh}
        .kingdom-planning-inner{width:min(1080px,100%);padding-top:clamp(76px,9vh,108px)}
        .kingdom-planning-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--edge)}
        .kingdom-planning-back{color:var(--brass);font-family:var(--font-body);font-size:12px;letter-spacing:.05em;text-decoration:none}
        .kingdom-planning-back:hover{color:var(--gold-hot)}
        .kingdom-planning-head{max-width:820px;margin-bottom:28px}
        @media(max-width:620px){.kingdom-planning-nav{align-items:flex-start;flex-direction:column}.kingdom-planning-inner{padding-top:70px}}
      `}</style>
    </main>
  );
}
