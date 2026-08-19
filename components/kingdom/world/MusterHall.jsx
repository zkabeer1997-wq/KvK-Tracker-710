'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * THE MUSTER HALL
 *
 * The member hub, built as a preparation hall rather than a row of
 * cards. Each destination is a physical station drawn in SVG — a
 * command table, a muster board, a campaign backpack, an armory rack —
 * that lights on hover/focus and carries its own label.
 *
 * Every station is a real <Link>, so keyboard and screen-reader users
 * get identical navigation to the pointer path.
 */

function CommandTable({ lit }) {
  return (
    <svg viewBox="0 0 200 150" className="station-art" aria-hidden="true" data-lit={lit}>
      {/* table */}
      <ellipse cx="100" cy="96" rx="76" ry="30" fill="#2a2013" stroke="#6b5024" strokeWidth="2" />
      <ellipse cx="100" cy="92" rx="70" ry="26" fill="#3a2c18" />
      {/* map on the surface */}
      <ellipse cx="100" cy="92" rx="58" ry="20" fill="#5b4526" opacity="0.75" />
      <path d="M62 92 Q86 82 108 92 T140 88" stroke="#c9a44e" strokeWidth="1.3" fill="none" opacity="0.85" />
      <path d="M74 100 L96 94 L118 100" stroke="#a8834a" strokeWidth="1" fill="none" opacity="0.6" />
      {/* rally markers */}
      <circle cx="84" cy="90" r="4" fill="#d9a94e" className="station-glint" />
      <circle cx="112" cy="94" r="4" fill="#a3283c" className="station-glint" />
      <circle cx="128" cy="87" r="4" fill="#3f74bd" className="station-glint" />
      {/* banner + horn */}
      <rect x="44" y="34" width="4" height="56" fill="#4a3a20" />
      <path d="M48 36 L78 42 L48 54 Z" fill="#8a6a28" />
      <path d="M144 78 q16 -6 22 4 q-12 8 -22 2 Z" fill="#6b5024" />
      {/* light pool */}
      <ellipse cx="100" cy="88" rx="62" ry="24" fill="url(#tableGlow)" className="station-pool" />
      <defs>
        <radialGradient id="tableGlow">
          <stop offset="0%" stopColor="#ffcb7a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffcb7a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function MusterBoard({ lit }) {
  return (
    <svg viewBox="0 0 200 150" className="station-art" aria-hidden="true" data-lit={lit}>
      {/* board */}
      <rect x="36" y="24" width="128" height="90" rx="3" fill="#2b2114" stroke="#6b5024" strokeWidth="2" />
      <rect x="42" y="30" width="116" height="78" fill="#3d2f1b" />
      {/* pinned rows */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="50" y={40 + i * 17} width="70" height="4" rx="2" fill="#8a6a28" opacity="0.7" />
          <rect x="126" y={38 + i * 17} width="24" height="8" rx="1" fill={['#d9a94e', '#a3283c', '#3f74bd', '#8a6a28'][i]} opacity="0.85" />
        </g>
      ))}
      {/* legs */}
      <rect x="56" y="114" width="6" height="26" fill="#4a3a20" />
      <rect x="138" y="114" width="6" height="26" fill="#4a3a20" />
      {/* shield rack */}
      <circle cx="30" cy="104" r="13" fill="#2f3650" stroke="#6b5024" strokeWidth="1.6" />
      <circle cx="172" cy="104" r="13" fill="#2f3650" stroke="#6b5024" strokeWidth="1.6" />
      <ellipse cx="100" cy="120" rx="66" ry="16" fill="url(#boardGlow)" className="station-pool" />
      <defs>
        <radialGradient id="boardGlow">
          <stop offset="0%" stopColor="#ffcb7a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffcb7a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function CampaignBackpack({ lit }) {
  return (
    <svg viewBox="0 0 200 150" className="station-art" aria-hidden="true" data-lit={lit}>
      {/* pack body */}
      <path d="M68 52 q32 -16 64 0 l8 62 q-40 12 -80 0 Z" fill="#4a3320" stroke="#7d5a2c" strokeWidth="2" />
      {/* flap */}
      <path d="M68 52 q32 -14 64 0 l3 22 q-35 10 -70 0 Z" fill="#5c4026" stroke="#7d5a2c" strokeWidth="1.6" />
      {/* straps */}
      <rect x="92" y="70" width="16" height="34" rx="3" fill="#2f2114" />
      <circle cx="100" cy="80" r="5" fill="#c9a44e" className="station-glint" />
      {/* scrolls + supplies around it */}
      <rect x="30" y="98" width="30" height="10" rx="5" fill="#d8c69c" stroke="#8a6a28" strokeWidth="1.2" />
      <rect x="36" y="86" width="26" height="9" rx="4.5" fill="#cbb894" stroke="#8a6a28" strokeWidth="1.2" />
      <circle cx="156" cy="104" r="11" fill="#3a2c18" stroke="#7d5a2c" strokeWidth="1.5" />
      <rect x="146" y="82" width="22" height="14" rx="2" fill="#2f3650" stroke="#6b5024" strokeWidth="1.2" />
      <ellipse cx="100" cy="120" rx="70" ry="16" fill="url(#packGlow)" className="station-pool" />
      <defs>
        <radialGradient id="packGlow">
          <stop offset="0%" stopColor="#ffcb7a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffcb7a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function ArmoryRack({ lit }) {
  return (
    <svg viewBox="0 0 200 150" className="station-art" aria-hidden="true" data-lit={lit}>
      {/* rack frame */}
      <rect x="40" y="30" width="120" height="8" rx="2" fill="#4a3a20" />
      <rect x="46" y="106" width="108" height="8" rx="2" fill="#4a3a20" />
      {/* armour pieces */}
      <path d="M100 42 q22 6 22 24 q0 26 -22 38 q-22 -12 -22 -38 q0 -18 22 -24 Z" fill="#39415c" stroke="#8a97c4" strokeWidth="1.6" />
      <path d="M100 52 q13 4 13 15 q0 15 -13 23 q-13 -8 -13 -23 q0 -11 13 -15 Z" fill="#2f3650" />
      <circle cx="100" cy="72" r="6" fill="#c9a44e" className="station-glint" />
      {/* flanking weapons */}
      <rect x="60" y="40" width="4" height="66" fill="#6b7391" />
      <path d="M56 40 l6 -12 l6 12 Z" fill="#8a97c4" />
      <rect x="136" y="40" width="4" height="66" fill="#6b7391" />
      <circle cx="138" cy="36" r="6" fill="#8a6a28" />
      <ellipse cx="100" cy="118" rx="64" ry="15" fill="url(#armGlow)" className="station-pool" />
      <defs>
        <radialGradient id="armGlow">
          <stop offset="0%" stopColor="#ffcb7a" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffcb7a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const STATIONS = [
  {
    key: 'lead',
    art: CommandTable,
    kicker: 'The Command Table',
    title: 'Rally Lead',
    line: 'Declare what you can anchor.',
    href: (id) => `/power-profile?member_id=${id}`,
  },
  {
    key: 'joiner',
    art: MusterBoard,
    kicker: 'The Muster Board',
    title: 'Rally Joiner',
    line: 'Report when and what you can bring.',
    href: (id) => `/player-record/form?member_id=${id}`,
  },
  {
    key: 'prep',
    art: CampaignBackpack,
    kicker: 'The Campaign Pack',
    title: 'KvK Prep',
    line: 'Are you packed?',
    href: (id) => `/prep-phase-backpack?member_id=${id}`,
  },
  {
    key: 'dragon',
    art: ArmoryRack,
    kicker: 'The Armory',
    title: 'Flamedragon Tyrant',
    line: 'Levels, heroes, availability.',
    href: (id) => `/flamedragon?member_id=${id}`,
  },
];

export default function MusterHall({ memberId }) {
  const [hot, setHot] = useState(null);
  const encoded = encodeURIComponent(memberId);

  return (
    <main className="k-scene muster">
      <div className="k-scene-layer muster-art" aria-hidden="true" />
      <div className="k-scene-layer muster-braziers" aria-hidden="true">
        <span className="muster-fire muster-fire-l" />
        <span className="muster-fire muster-fire-r" />
      </div>
      <div className="k-scene-layer k-vignette" aria-hidden="true" />

      <div className="muster-inner">
        <header className="muster-head">
          <span className="k-mark">Muster Hall</span>
          <h1 className="k-display muster-title k-engraved">Welcome back, {memberId}</h1>
          <p className="k-narrative muster-lede">
            The hall is prepared. Take what you need to the table.
          </p>
        </header>

        <nav className="stations" aria-label="Muster hall stations">
          {STATIONS.map((s) => {
            const Art = s.art;
            return (
              <Link
                key={s.key}
                href={s.href(encoded)}
                className="station"
                data-hot={hot === s.key}
                onMouseEnter={() => setHot(s.key)}
                onMouseLeave={() => setHot((h) => (h === s.key ? null : h))}
                onFocus={() => setHot(s.key)}
                onBlur={() => setHot((h) => (h === s.key ? null : h))}
              >
                <Art lit={hot === s.key} />
                <span className="station-label">
                  <span className="k-mark station-kicker">{s.kicker}</span>
                  <span className="k-display station-title">{s.title}</span>
                  <span className="k-narrative station-line">{s.line}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
