import Link from 'next/link';
import WaveboundCharmOptimizer from './WaveboundCharmOptimizer';

export const metadata = {
  title: 'K710 Tools & Calculators',
};

export default function ToolsPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const backHref = memberId ? `/player-record?member_id=${encodeURIComponent(memberId)}` : '/player-record';

  return (
    <main style={{minHeight:'100vh',background:'radial-gradient(circle at 50% 0%,rgba(70,166,205,.18),transparent 34rem),#07131c',color:'#edf8ff',padding:'28px 18px 54px'}}>
      <div style={{width:'min(1220px,100%)',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',marginBottom:18,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'#d3a94e',fontWeight:900}}>Kingdom 710 Workshop</div>
            <h1 style={{fontFamily:"Georgia,'Times New Roman',serif",fontWeight:500,fontSize:'clamp(34px,5vw,58px)',lineHeight:1,margin:'7px 0 6px'}}>Tools & Calculators</h1>
            <p style={{color:'#839eae',fontSize:13,margin:0}}>Member utilities for event planning and upgrade optimization.</p>
          </div>
          <Link href={backHref} style={{color:'#d7e7ef',textDecoration:'none',border:'1px solid #28516a',borderRadius:9,padding:'10px 13px',fontSize:12}}>← Back to member gate</Link>
        </div>
        <WaveboundCharmOptimizer />
      </div>
    </main>
  );
}
