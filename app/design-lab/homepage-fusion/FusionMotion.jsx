'use client';

import { useEffect } from 'react';
import './motion.css';

export default function FusionMotion() {
  useEffect(() => {
    const root = document.querySelector('.fusion-page');
    const hero = document.querySelector('.fusion-hero');
    const story = document.querySelector('.story-section');
    if (!root || !hero) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let mx = 0;
    let my = 0;

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const update = () => {
      raf = 0;
      if (reduceMotion.matches) {
        root.style.setProperty('--hero-scroll', '0');
        root.style.setProperty('--story-scroll', '0');
        root.style.setProperty('--mouse-x', '0');
        root.style.setProperty('--mouse-y', '0');
        return;
      }

      const heroRect = hero.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const heroProgress = clamp((viewport - heroRect.top) / (viewport + heroRect.height), 0, 1);
      const heroSigned = (heroProgress - 0.46) * 2;
      root.style.setProperty('--hero-scroll', heroSigned.toFixed(4));
      root.style.setProperty('--mouse-x', mx.toFixed(4));
      root.style.setProperty('--mouse-y', my.toFixed(4));

      if (story) {
        const storyRect = story.getBoundingClientRect();
        const storyProgress = clamp((viewport - storyRect.top) / (viewport + storyRect.height), 0, 1);
        root.style.setProperty('--story-scroll', ((storyProgress - 0.5) * 2).toFixed(4));
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onPointerMove = (event) => {
      if (reduceMotion.matches || window.innerWidth < 900) return;
      mx = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
      my = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
      schedule();
    };

    const onPointerLeave = () => {
      mx = 0;
      my = 0;
      schedule();
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
    reduceMotion.addEventListener?.('change', schedule);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
      reduceMotion.removeEventListener?.('change', schedule);
    };
  }, []);

  return null;
}
