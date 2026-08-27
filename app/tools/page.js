import Link from 'next/link';
import ToolsDirectory from './ToolsDirectory';

export const metadata = {
  title: 'K710 Tools & Calculators',
  description: 'Economy optimizers for Kingdom 710 — Governor Charm pack planning, Wavebound Voyage merging, Flamedragon Tyrant, and Adventure Stall shop math.',
};

export default async function ToolsPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const backHref = memberId ? `/player-record?member_id=${encodeURIComponent(memberId)}` : '/player-record';
  return <main className="armory tools-workshop">
    <div className="armory-atmos" aria-hidden="true"/><span className="armory-rack-l" aria-hidden="true"/><span className="armory-rack-r" aria-hidden="true"/>
    <div className="armory-inner tools-workshop-inner">
      <header className="armory-head tools-workshop-head"><span className="k-mark">Kingdom 710 Workshop</span><h1 className="k-display armory-title">Tools &amp; Calculators</h1><p className="k-narrative armory-lede">Choose a discipline, then open an instrument from the workshop.</p></header>
      <ToolsDirectory memberId={memberId}/><Link href={backHref} className="tools-back">← Return to member gate</Link>
    </div>
    <style>{`.tools-workshop{color:var(--parchment)}.tools-workshop-inner{width:min(1100px,100%)}.tools-workshop-head{margin-bottom:clamp(28px,5vh,48px)}.tools-back{display:inline-block;margin-top:34px;color:var(--brass);font-family:var(--font-body);font-size:12px;text-decoration:none;letter-spacing:.06em}.tools-back:hover{color:var(--gold-hot)}@media(max-width:700px){.tools-workshop-inner{padding-top:86px}}`}</style>
  </main>;
}
