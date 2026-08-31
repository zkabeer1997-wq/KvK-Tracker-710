'use client';

import { useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'k710-forge-seen';

export default function ForgeLoader({ onDone, reducedMotion }) {
  const canvasRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);
  const alreadySeen = useRef(typeof window !== 'undefined' && sessionStorage.getItem(SEEN_KEY) === '1');

  useEffect(() => {
    const duration = reducedMotion ? 250 : (alreadySeen.current ? 700 : 2200);
    const fadeAt = duration - 350;

    let raf = null;
    let start = null;
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;
    const particles = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    if (ctx && !reducedMotion) {
      resize();
      window.addEventListener('resize', resize);
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 260,
          y: canvas.height / 2 + 80 + Math.random() * 60,
          vy: 0.4 + Math.random() * 1.2,
          vx: (Math.random() - 0.5) * 0.3,
          r: 1 + Math.random() * 2.2,
          life: Math.random(),
        });
      }

      const draw = (ts) => {
        if (start === null) start = ts;
        const t = ts - start;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.y -= p.vy;
          p.x += p.vx;
          p.life += 0.006;
          if (p.life > 1) p.life = 0;
          const alpha = Math.sin(p.life * Math.PI);
          ctx.beginPath();
          ctx.fillStyle = `rgba(217, 98, 45, ${alpha * 0.85})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        if (t < duration) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    }

    const fadeTimer = setTimeout(() => setFadeOut(true), fadeAt);
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem(SEEN_KEY, '1');
      onDone();
    }, duration);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`forge-loader${fadeOut ? ' forge-loader-fade' : ''}`} role="status" aria-live="polite" aria-label="Loading Kingdom 710">
      {!reducedMotion && <canvas ref={canvasRef} className="forge-canvas" aria-hidden="true" />}
      <div className="forge-center">
        <svg className="forge-crest" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <circle cx="100" cy="100" r="92" stroke="rgba(217,169,78,0.18)" strokeWidth="1" />
          <path d="M100 10 L175 35 V95 C175 140 145 170 100 190 C55 170 25 140 25 95 V35 Z" stroke="#d9a94e" strokeWidth="2" className="forge-crest-outline" />
          <text x="100" y="112" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="900" fontSize="46" fill="#d9a94e" className="forge-crest-glyph">710</text>
        </svg>
        <div className="forge-title">KINGDOM 710</div>
        <div className="forge-sub">Loading Kingdom 710</div>
      </div>
    </div>
  );
}
