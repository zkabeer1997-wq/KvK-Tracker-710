'use client';

import Link from 'next/link';

const destinations = [
  {
    key: 'tools',
    eyebrow: 'Workshop',
    title: 'Tools & Calculators',
    description: 'Planning tools for events, upgrades, and kingdom strategy.',
    href: (id) => `/tools?member_id=${id}`,
    icon: '⚙',
  },
  {
    key: 'forms',
    eyebrow: 'Muster Hall',
    title: 'Forms',
    description: 'Rally Lead, Rally Joiner, KvK Prep, and Flamedragon Tyrant.',
    href: (id) => `/forms?member_id=${id}`,
    icon: '✦',
  },
  {
    key: 'admin',
    eyebrow: 'Restricted',
    title: 'Admin Portal',
    description: 'Kingdom administration and response management.',
    href: () => '/admin',
    icon: '♜',
  },
  {
    key: 'new',
    eyebrow: 'Coming Soon',
    title: 'New Tools',
    description: 'Additional kingdom utilities are being forged.',
    href: () => '/new-tools',
    icon: '＋',
  },
];

export default function MemberHub({ memberId }) {
  const encoded = encodeURIComponent(memberId || '');

  return (
    <main className="member-hub">
      <div className="member-hub-bg" aria-hidden="true" />
      <div className="member-hub-vignette" aria-hidden="true" />

      <div className="member-hub-inner">
        <header className="member-hub-head">
          <span className="member-hub-mark">Kingdom 710 · Member Access · {memberId}</span>
          <h1>Choose your destination</h1>
          <p>The inner hall has been reorganized. Select a chamber to continue.</p>
        </header>

        <nav className="member-destinations" aria-label="Member destinations">
          {destinations.map((item) => (
            <Link key={item.key} href={item.href(encoded)} className={`member-destination member-destination-${item.key}`}>
              <span className="member-destination-icon" aria-hidden="true">{item.icon}</span>
              <span className="member-destination-copy">
                <span className="member-destination-eyebrow">{item.eyebrow}</span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
              <span className="member-destination-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </div>

      <style jsx>{`
        .member-hub{min-height:100vh;position:relative;overflow:hidden;color:#f5ead2;background:#0c1116;display:grid;place-items:center;padding:42px 24px}
        .member-hub-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 12%,rgba(211,169,78,.18),transparent 34%),linear-gradient(180deg,#182129 0%,#10171d 42%,#090d11 100%)}
        .member-hub-bg:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 12.4%,rgba(255,255,255,.015) 12.5%,transparent 12.7%)}
        .member-hub-vignette{position:absolute;inset:0;box-shadow:inset 0 0 180px rgba(0,0,0,.82);pointer-events:none}
        .member-hub-inner{position:relative;z-index:1;width:min(1440px,100%)}
        .member-hub-head{text-align:center;margin:0 auto 34px;max-width:820px}
        .member-hub-mark{display:inline-block;color:#d3a94e;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;margin-bottom:12px}
        .member-hub-head h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(36px,5vw,68px);font-weight:500;line-height:1;margin:0;color:#f2e6ca;text-shadow:0 3px 18px rgba(0,0,0,.6)}
        .member-hub-head p{margin:14px auto 0;color:#a9b1b4;font-size:15px;line-height:1.65}
        .member-destinations{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:stretch}
        .member-destination{min-height:310px;position:relative;display:flex;flex-direction:column;justify-content:flex-end;gap:18px;padding:24px;text-decoration:none;color:inherit;border:1px solid rgba(211,169,78,.28);border-radius:6px;background:linear-gradient(180deg,rgba(36,42,45,.74),rgba(19,24,28,.95));box-shadow:0 18px 55px rgba(0,0,0,.34),inset 0 1px rgba(255,255,255,.035);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;overflow:hidden}
        .member-destination:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 22%,rgba(211,169,78,.12),transparent 42%);opacity:.7;transition:opacity .2s ease}
        .member-destination:hover,.member-destination:focus-visible{transform:translateY(-5px);border-color:rgba(237,197,106,.75);box-shadow:0 24px 70px rgba(0,0,0,.5),0 0 28px rgba(211,169,78,.08);outline:none}
        .member-destination:hover:before,.member-destination:focus-visible:before{opacity:1}
        .member-destination-icon{position:absolute;top:28px;left:50%;transform:translateX(-50%);width:92px;height:92px;border-radius:50%;display:grid;place-items:center;font-size:42px;color:#e5c06b;border:1px solid rgba(229,192,107,.28);background:radial-gradient(circle,rgba(211,169,78,.15),rgba(0,0,0,.14));box-shadow:0 0 40px rgba(211,169,78,.08)}
        .member-destination-copy{position:relative;z-index:1;display:flex;flex-direction:column;text-align:center;align-items:center}
        .member-destination-eyebrow{color:#d3a94e!important;font-size:10px!important;letter-spacing:.18em;text-transform:uppercase;font-weight:800;margin-bottom:7px}
        .member-destination-copy strong{font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:500;color:#f2e6ca;margin-bottom:8px}
        .member-destination-copy>span:last-child{color:#929ca0;font-size:12px;line-height:1.55;max-width:220px}
        .member-destination-arrow{position:relative;z-index:1;text-align:center;color:#d3a94e;font-size:22px;line-height:1}
        .member-destination-new{filter:saturate(.72)}
        @media(max-width:1000px){.member-destinations{grid-template-columns:repeat(2,minmax(0,1fr))}.member-destination{min-height:280px}}
        @media(max-width:620px){.member-hub{padding:30px 16px}.member-destinations{grid-template-columns:1fr}.member-destination{min-height:220px}.member-destination-icon{width:72px;height:72px;font-size:34px;top:20px}.member-destination-copy strong{font-size:22px}}
      `}</style>
    </main>
  );
}
