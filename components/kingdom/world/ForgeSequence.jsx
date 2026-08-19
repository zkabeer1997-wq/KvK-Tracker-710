'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export const FORGE_SEEN_KEY = 'k710-forge-seen-v2';

/**
 * SCENE 1 — SIGIL FORGE
 *
 * Opening cinematic, not a loader. Molten metal pours into the crest,
 * the sigil is struck, cools white-hot -> gold, embers drift, and the
 * camera pushes through the crest to reveal the Gate.
 *
 * Deliberately canvas-2D: it is far cheaper than WebGL for molten
 * particle work, never blocks on shader compilation, and still runs
 * when WebGL is unavailable -- so the opening can never trap a user.
 *
 * Guarantees:
 *  - skippable at any time (click, Esc, Space, Enter)
 *  - hard timeout that force-resolves
 *  - reduced-motion path resolves almost immediately
 *  - repeat visits in the same session get a short version
 */
export default function ForgeSequence({ onDone, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const [phase, setPhase] = useState('forge'); // forge -> through -> gone

  const seen =
    typeof window !== 'undefined' && sessionStorage.getItem(FORGE_SEEN_KEY) === '1';

  // Total runtime. Brief target 2-4s; repeat visits get a fast pass.
  const DURATION = reducedMotion ? 320 : seen ? 1150 : 3200;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem(FORGE_SEEN_KEY, '1');
    } catch {
      /* private mode - non-fatal */
    }
    setPhase('through');
    // let the push-through play, then hand off
    window.setTimeout(() => {
      setPhase('gone');
      onDone();
    }, reducedMotion ? 120 : 520);
  }, [onDone, reducedMotion]);

  // Skip affordances
  useEffect(() => {
    const onKey = (e) => {
      if (['Escape', ' ', 'Enter', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  // Hard safety timeout: even if rAF never runs (background tab,
  // throttled device), the experience must resolve.
  useEffect(() => {
    const hard = window.setTimeout(finish, DURATION + 1800);
    return () => window.clearTimeout(hard);
  }, [DURATION, finish]);

  useEffect(() => {
    if (reducedMotion) {
      const t = window.setTimeout(finish, DURATION);
      return () => window.clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const t = window.setTimeout(finish, 400);
      return () => window.clearTimeout(t);
    }

    let raf = 0;
    let start = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Canvas cannot resolve CSS custom properties inside ctx.font, so
    // resolve the next/font-generated family name up front and fall back
    // to a real serif if it is not available yet.
    const rootStyle = getComputedStyle(document.documentElement);
    const displayFamily =
      (rootStyle.getPropertyValue('--font-display-loaded') || '').trim() ||
      'Georgia';
    const crestFont = (px) => `900 ${px}px ${displayFamily}, Georgia, serif`;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    // --- particles -------------------------------------------------
    const sparks = [];
    const embers = [];

    function spawnSparks(cx, cy, n, power) {
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.6 + Math.random() * 2.4) * power;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 1.1,
          life: 1,
          decay: 0.012 + Math.random() * 0.026,
          r: 0.7 + Math.random() * 1.9,
        });
      }
    }

    for (let i = 0; i < 44; i += 1) {
      embers.push({
        x: Math.random(),
        y: 0.6 + Math.random() * 0.6,
        vy: 0.00035 + Math.random() * 0.0011,
        drift: (Math.random() - 0.5) * 0.00035,
        r: 0.6 + Math.random() * 1.7,
        o: 0.25 + Math.random() * 0.6,
      });
    }

    // Crest outline in normalised units, drawn as a shield path.
    function shieldPath(g, cx, cy, s) {
      g.beginPath();
      g.moveTo(cx, cy - 1.02 * s);
      g.lineTo(cx + 0.78 * s, cy - 0.72 * s);
      g.lineTo(cx + 0.78 * s, cy + 0.12 * s);
      g.bezierCurveTo(
        cx + 0.78 * s, cy + 0.70 * s,
        cx + 0.40 * s, cy + 0.96 * s,
        cx, cy + 1.12 * s,
      );
      g.bezierCurveTo(
        cx - 0.40 * s, cy + 0.96 * s,
        cx - 0.78 * s, cy + 0.70 * s,
        cx - 0.78 * s, cy + 0.12 * s,
      );
      g.lineTo(cx - 0.78 * s, cy - 0.72 * s);
      g.closePath();
    }

    let struck = false;

    function frame(ts) {
      if (!running) return;
      if (!start) start = ts;
      const t = ts - start;
      const p = Math.min(t / DURATION, 1); // 0..1 overall

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const S = Math.min(W, H) * 0.20;

      ctx.clearRect(0, 0, W, H);

      // Ground glow of the forge, breathing.
      const glowR = Math.max(W, H) * (0.30 + 0.06 * Math.sin(t / 240));
      const bg = ctx.createRadialGradient(cx, cy + S * 0.4, 0, cx, cy + S * 0.4, glowR);
      const heat = 0.18 + 0.55 * Math.min(p / 0.55, 1);
      bg.addColorStop(0, `rgba(226,105,42,${0.16 * heat})`);
      bg.addColorStop(0.45, `rgba(120,48,18,${0.08 * heat})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // --- molten pour (0 -> 0.42): metal fills the crest ----------
      const fill = Math.min(p / 0.42, 1);

      // --- strike at 0.5 -------------------------------------------
      if (!struck && p > 0.5) {
        struck = true;
        spawnSparks(cx, cy, 120, 1.7 * dpr);
      }
      if (p > 0.14 && p < 0.5 && Math.random() < 0.32) {
        spawnSparks(
          cx + (Math.random() - 0.5) * S * 1.2,
          cy + S * (0.6 - fill * 1.5),
          2,
          0.9 * dpr,
        );
      }

      // Cooling: white-hot -> gold, from the strike onward.
      const cool = Math.max(0, Math.min((p - 0.5) / 0.42, 1));
      const rC = Math.round(255 - 12 * cool);
      const gC = Math.round(238 - 68 * cool);
      const bC = Math.round(198 - 120 * cool);
      const metal = `rgb(${rC},${gC},${bC})`;

      ctx.save();
      ctx.translate(cx, cy);
      const strikeSquash = struck ? 1 + 0.06 * Math.exp(-(p - 0.5) * 26) : 1;
      ctx.scale(strikeSquash, 1 / strikeSquash);
      ctx.translate(-cx, -cy);

      // Molten body, clipped to the crest, rising as it pours.
      ctx.save();
      shieldPath(ctx, cx, cy, S);
      ctx.clip();
      const top = cy + S * 1.12 - fill * S * 2.16;
      // Molten metal is hottest at the surface but still incandescent all
      // the way down -- falling to ~20% brightness read as an empty crest.
      const mg = ctx.createLinearGradient(0, top, 0, cy + S * 1.12);
      mg.addColorStop(0, metal);
      mg.addColorStop(0.35, `rgb(${Math.round(rC * 0.94)},${Math.round(gC * 0.80)},${Math.round(bC * 0.62)})`);
      mg.addColorStop(1, `rgb(${Math.round(rC * 0.74)},${Math.round(gC * 0.46)},${Math.round(bC * 0.24)})`);
      ctx.fillStyle = mg;
      ctx.fillRect(cx - S, top, S * 2, S * 2.4);

      // Bright meniscus at the pour surface while it is still filling.
      if (fill < 1) {
        ctx.fillStyle = '#fff4d6';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(cx - S, top - 1.6 * dpr, S * 2, 3.2 * dpr);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // Crest edge, brightening as it is struck.
      ctx.lineWidth = Math.max(1.4, 2.6 * dpr);
      ctx.strokeStyle = metal;
      ctx.shadowColor = `rgba(255,${160 + 60 * (1 - cool)},80,${0.75 - 0.35 * cool})`;
      ctx.shadowBlur = (26 - 14 * cool) * dpr;
      shieldPath(ctx, cx, cy, S);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner bevel line
      ctx.globalAlpha = 0.5 * fill;
      ctx.lineWidth = Math.max(1, 1.1 * dpr);
      shieldPath(ctx, cx, cy, S * 0.82);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // "710" struck into the metal after the blow.
      if (p > 0.52) {
        const a = Math.min((p - 0.52) / 0.2, 1);
        ctx.globalAlpha = a;
        ctx.font = crestFont(S * 0.62);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(30,18,6,${0.55 * a})`;
        ctx.fillText('710', cx, cy + S * 0.10 + 2 * dpr);
        ctx.fillStyle = metal;
        ctx.fillText('710', cx, cy + S * 0.08);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // --- sparks ----------------------------------------------------
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.055 * dpr;
        s.vx *= 0.985;
        s.life -= s.decay;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.life > 0.55 ? '#fff0c9' : '#e2692a';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- drifting embers ------------------------------------------
      embers.forEach((e) => {
        e.y -= e.vy;
        e.x += e.drift;
        if (e.y < -0.05) {
          e.y = 1.05;
          e.x = Math.random();
        }
        ctx.globalAlpha = e.o * (0.35 + 0.65 * Math.min(p / 0.4, 1));
        ctx.fillStyle = '#e2692a';
        ctx.beginPath();
        ctx.arc(e.x * W, e.y * H, e.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (p >= 1) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [DURATION, finish, reducedMotion]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`forge2 ${phase === 'through' ? 'forge2-through' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Forging the Kingdom 710 sigil"
      onClick={finish}
    >
      {!reducedMotion && <canvas ref={canvasRef} className="forge2-canvas" aria-hidden="true" />}

      <div className="forge2-copy">
        <div className="k-mark forge2-kicker">Kingdom 710</div>
        <div className="k-display forge2-title">Three Warbands. One Unbroken Watch.</div>
      </div>

      <button type="button" className="forge2-skip k-ui" onClick={finish}>
        Skip
      </button>
    </div>
  );
}
