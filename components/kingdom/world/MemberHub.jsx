'use client';

import Link from 'next/link';

const destinations = [
  {
    key: 'tools',
    kicker: 'The Workshop',
    title: 'Tools & Calculators',
    description: 'Event planning, upgrade optimization, and kingdom utilities.',
    href: (id) => `/tools?member_id=${id}`,
    emblem: '⚙',
  },
  {
    key: 'forms',
    kicker: 'The Muster Hall',
    title: 'Forms',
    description: 'Rally Lead, Rally Joiner, KvK Prep, and Flamedragon Tyrant.',
    href: (id) => `/forms?member_id=${id}`,
    emblem: '✦',
  },
  {
    key: 'admin',
    kicker: 'Restricted Command',
    title: 'Admin Portal',
    description: 'Kingdom administration and response management.',
    href: () => '/admin',
    emblem: '♜',
  },
  {
    key: 'new',
    kicker: 'Under Construction',
    title: 'New Tools',
    description: 'More kingdom utilities are being forged.',
    href: () => '/new-tools',
    emblem: '+',
  },
];

function KingdomCrest() {
  return (
    <svg className="muster-crest" viewBox="0 0 120 140" aria-hidden="true">
      <defs>
        <linearGradient id="hubCrestStone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b4638" />
          <stop offset="100%" stopColor="#191713" />
        </linearGradient>
      </defs>
      <path d="M60 6 L110 22 V70 C110 100 88 122 60 134 C32 122 10 100 10 70 V22 Z" fill="url(#hubCrestStone)" stroke="#8a6a28" strokeWidth="3" />
      <path d="M60 16 L100 29 V70 C100 95 82 113 60 124 C38 113 20 95 20 70 V29 Z" fill="none" stroke="rgba(201,164,78,0.42)" strokeWidth="1.4" />
      <path d="M60 44 L74 52 V70 L60 82 L46 70 V52 Z" fill="#c9a44e" opacity="0.55" />
      <path d="M60 54 L67 58 V68 L60 74 L53 68 V58 Z" fill="#1c1710" />
    </svg>
  );
}

export default function MemberHub({ memberId }) {
  const encoded = encodeURIComponent(memberId || '');

  return (
    <main className="k-scene muster member-chambers">
      <div className="k-scene-layer muster-wall" aria-hidden="true" />
      <span className="muster-pillar muster-pillar-l" aria-hidden="true" />
      <span className="muster-pillar muster-pillar-r" aria-hidden="true" />
      <KingdomCrest />
      <span className="muster-banner muster-banner-l" data-band="RED" aria-hidden="true" />
      <span className="muster-banner muster-banner-r" data-band="SKY" aria-hidden="true" />
      <div className="muster-floor" aria-hidden="true" />
      <span className="muster-brazier muster-brazier-l" aria-hidden="true"><span className="muster-foot" /><span className="muster-flame" /></span>
      <span className="muster-brazier muster-brazier-r" aria-hidden="true"><span className="muster-foot" /><span className="muster-flame" /></span>
      <div className="k-scene-layer k-vignette" aria-hidden="true" />

      <div className="muster-inner member-chambers-inner">
        <header className="muster-head member-chambers-head">
          <span className="k-mark">Inner Hall &middot; Member {memberId}</span>
          <h1 className="k-display member-chambers-title">Choose your chamber</h1>
          <p className="k-narrative member-chambers-lede">Four doors stand open inside the kingdom. Choose where you need to go.</p>
        </header>

        <nav className="hall member-hall" aria-label="Member destinations">
          {destinations.map((item, index) => (
            <Link
              key={item.key}
              href={item.href(encoded)}
              className={`hall-station member-station member-station-${item.key}`}
              style={{ '--depth': index === 0 || index === 3 ? 0.9 : 1 }}
            >
              <span className="hall-object member-relic-wrap">
                <span className="member-relic" aria-hidden="true">
                  <span className="member-relic-top" />
                  <span className="member-relic-face">
                    <span className="member-relic-emblem">{item.emblem}</span>
                  </span>
                  <span className="member-relic-base" />
                </span>
                <span className="hall-shadow" aria-hidden="true" />
              </span>
              <span className="hall-plaque member-plaque">
                <span className="k-mark hall-kicker">{item.kicker}</span>
                <span className="k-display hall-title">{item.title}</span>
                <span className="k-narrative hall-line">{item.description}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <style jsx>{`
        .member-chambers-inner{padding-top:clamp(142px,19vh,218px)}
        .member-chambers-head{margin-bottom:clamp(22px,4vh,44px)}
        .member-chambers-title{margin:10px 0 0;font-size:clamp(22px,3vw,38px);letter-spacing:.12em;color:var(--parchment)}
        .member-chambers-lede{max-width:52ch;margin:12px auto 0;color:var(--parchment-dim);font-size:clamp(15px,1.4vw,18px);font-style:italic}
        .member-hall{margin-top:auto}
        .member-relic-wrap{height:clamp(170px,20vw,250px);display:flex;align-items:flex-end;justify-content:center}
        .member-relic{position:relative;width:min(72%,190px);height:82%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;filter:drop-shadow(0 12px 8px rgba(0,0,0,.58));transition:filter var(--t-ui) ease}
        .member-relic-top{width:76%;height:13px;background:linear-gradient(180deg,#8e826b,#38332b);border:1px solid rgba(201,164,78,.28);border-radius:2px 2px 0 0}
        .member-relic-face{width:68%;flex:1;min-height:106px;display:grid;place-items:center;background:linear-gradient(90deg,#292822,#565145 48%,#24231f);border-inline:1px solid rgba(201,164,78,.24);position:relative}
        .member-relic-face:after{content:'';position:absolute;inset:13% 15%;border:1px solid rgba(201,164,78,.24);clip-path:polygon(50% 0,94% 18%,88% 72%,50% 100%,12% 72%,6% 18%)}
        .member-relic-emblem{position:relative;z-index:1;display:grid;place-items:center;width:64px;height:64px;color:#d9b65b;font-family:var(--font-display);font-size:34px;text-shadow:0 2px 8px #000}
        .member-relic-base{width:90%;height:18px;background:linear-gradient(180deg,#5a5242,#25231e);border-top:1px solid rgba(201,164,78,.3);border-radius:2px}
        .member-station:hover .member-relic,.member-station:focus-visible .member-relic{filter:drop-shadow(0 15px 10px rgba(0,0,0,.62)) drop-shadow(0 0 9px rgba(201,164,78,.2))}
        .member-station-tools .member-relic-face{background:linear-gradient(90deg,#242b2e,#4c5a59 48%,#202729)}
        .member-station-forms .member-relic-face{background:linear-gradient(90deg,#30281c,#695537 48%,#2b2419)}
        .member-station-admin .member-relic-face{background:linear-gradient(90deg,#242532,#4d5064 48%,#20212b)}
        .member-station-new{opacity:.72}
        .member-station-new:hover,.member-station-new:focus-visible{opacity:1}
        .member-plaque{margin-top:10px}
        @media(max-width:1000px){.member-chambers-inner{padding-top:112px}.member-relic-wrap{height:210px}.member-hall{row-gap:22px}.member-chambers-head{margin-bottom:20px}}
        @media(max-width:560px){.member-chambers-inner{padding-top:92px}.member-chambers-title{font-size:22px}.member-chambers-lede{font-size:15px}.member-relic-wrap{height:170px}.member-relic{width:150px}.member-relic-emblem{font-size:30px}}
        @media(prefers-reduced-motion:reduce){.member-relic{transition:none}}
      `}</style>
    </main>
  );
}
