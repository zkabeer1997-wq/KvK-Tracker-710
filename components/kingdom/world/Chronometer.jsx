'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * The real K710 Bear Hunt schedule. These are the operational times the
 * kingdom actually runs on, so the instrument is driven by production
 * data rather than decoration.
 */
export const HUNTS = [
  { band: '710', utc: '02:00' },
  { band: 'RED', utc: '11:05' },
  { band: 'SKY', utc: '12:00' },
  { band: '710', utc: '13:00' },
  { band: 'RED', utc: '19:00' },
  { band: 'SKY', utc: '20:00' },
  { band: 'RED', utc: '23:20' },
];

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function pad(n) {
  return String(n).padStart(2, '0');
}

export function nextHunt(nowMin) {
  const sorted = [...HUNTS].sort((a, b) => toMinutes(a.utc) - toMinutes(b.utc));
  const upcoming = sorted.find((h) => toMinutes(h.utc) > nowMin);
  const target = upcoming || sorted[0];
  const delta = upcoming
    ? toMinutes(target.utc) - nowMin
    : 1440 - nowMin + toMinutes(target.utc);
  return { ...target, inMin: delta };
}

/**
 * A monumental brass instrument: 24-hour ring, warband gemstones set at
 * each hunt window, a sweeping watch hand on real UTC, and the next
 * window physically lit. Rendered as SVG so it stays crisp, cheap,
 * accessible, and works with no WebGL.
 */
export default function Chronometer() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(() => {
    if (!now) return null;
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    const nx = nextHunt(nowMin);
    return {
      nowMin,
      utc: `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`,
      next: nx,
      countdown: `${pad(Math.floor(nx.inMin / 60))}h ${pad(nx.inMin % 60)}m`,
    };
  }, [now]);

  // Server render / pre-hydration: reserve the space, no layout shift.
  if (!data) {
    return <div className="chrono" aria-hidden="true" style={{ minHeight: 420 }} />;
  }

  const R = 190;
  const C = 240;
  const handAngle = (data.nowMin / 1440) * 360 - 90;

  return (
    <div className="chrono">
      <svg
        className="chrono-dial"
        viewBox="0 0 480 480"
        role="img"
        aria-label={`Kingdom watch. Current time ${data.utc} UTC. Next Bear Hunt: ${data.next.band} warband at ${data.next.utc} UTC, in ${data.countdown}.`}
      >
        <defs>
          <radialGradient id="chronoFace" cx="42%" cy="34%">
            <stop offset="0%" stopColor="#2a2f42" />
            <stop offset="62%" stopColor="#161a26" />
            <stop offset="100%" stopColor="#0a0c14" />
          </radialGradient>
          <linearGradient id="chronoBrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c98d" />
            <stop offset="45%" stopColor="#a8834a" />
            <stop offset="100%" stopColor="#5d4726" />
          </linearGradient>
          <filter id="chronoGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* outer brass case */}
        <circle cx={C} cy={C} r={R + 30} fill="none" stroke="url(#chronoBrass)" strokeWidth="10" />
        <circle cx={C} cy={C} r={R + 17} fill="none" stroke="#3a2f1c" strokeWidth="2" />
        <circle cx={C} cy={C} r={R + 6} fill="url(#chronoFace)" stroke="#4a3a20" strokeWidth="1.5" />

        {/* hour ticks — 24 of them */}
        {Array.from({ length: 24 }).map((_, h) => {
          const a = ((h / 24) * 360 - 90) * (Math.PI / 180);
          const major = h % 6 === 0;
          const r1 = R - (major ? 20 : 11);
          return (
            <g key={h}>
              <line
                x1={C + Math.cos(a) * r1}
                y1={C + Math.sin(a) * r1}
                x2={C + Math.cos(a) * R}
                y2={C + Math.sin(a) * R}
                stroke={major ? '#c9a44e' : '#6b5836'}
                strokeWidth={major ? 2.4 : 1.2}
              />
              {major && (
                <text
                  x={C + Math.cos(a) * (R - 36)}
                  y={C + Math.sin(a) * (R - 36) + 4}
                  textAnchor="middle"
                  fontSize="13"
                  fontFamily="var(--font-mono-loaded), monospace"
                  fill="#8d7a4e"
                >
                  {pad(h)}
                </text>
              )}
            </g>
          );
        })}

        {/* hunt gemstones set into the ring */}
        {HUNTS.map((h) => {
          const m = toMinutes(h.utc);
          const a = ((m / 1440) * 360 - 90) * (Math.PI / 180);
          const x = C + Math.cos(a) * (R - 4);
          const y = C + Math.sin(a) * (R - 4);
          const isNext = h.band === data.next.band && h.utc === data.next.utc;
          const fill =
            h.band === '710' ? '#d9a94e' : h.band === 'RED' ? '#a3283c' : '#3f74bd';
          return (
            <g key={`${h.band}-${h.utc}`} filter={isNext ? 'url(#chronoGlow)' : undefined}>
              <circle cx={x} cy={y} r={isNext ? 11 : 7.5} fill="#20180c" stroke="url(#chronoBrass)" strokeWidth="2" />
              <circle cx={x} cy={y} r={isNext ? 6.5 : 4.4} fill={fill} />
              {isNext && <circle cx={x} cy={y} r={15} fill="none" stroke={fill} strokeWidth="1.4" opacity="0.6" />}
            </g>
          );
        })}

        {/* watch hand on live UTC */}
        <g transform={`rotate(${handAngle} ${C} ${C})`}>
          <line x1={C} y1={C} x2={C + R - 26} y2={C} stroke="#e6c98d" strokeWidth="2.6" />
          <circle cx={C + R - 26} cy={C} r="3.6" fill="#f3d99a" />
        </g>

        {/* hub */}
        <circle cx={C} cy={C} r="17" fill="#1a1e2c" stroke="url(#chronoBrass)" strokeWidth="3" />
        <circle cx={C} cy={C} r="5" fill="#c9a44e" />
      </svg>

      {/* Engraved command rail — the readout is part of the instrument,
          not four cards sitting next to it. */}
      <div className="chrono-rail k-plate">
        <div className="chrono-read">
          <span className="k-mark">Kingdom Time</span>
          <strong className="chrono-utc">{data.utc}</strong>
          <span className="chrono-unit">UTC</span>
        </div>
        <div className="chrono-rail-div" aria-hidden="true" />
        <div className="chrono-read k-wb" data-band={data.next.band}>
          <span className="k-mark">Next Watch</span>
          <strong className="chrono-next">
            <span className="k-gem" aria-hidden="true" />
            {data.next.band} · {data.next.utc}
          </strong>
          <span className="chrono-unit">in {data.countdown}</span>
        </div>
      </div>
    </div>
  );
}
