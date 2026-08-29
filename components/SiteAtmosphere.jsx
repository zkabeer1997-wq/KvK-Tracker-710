'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const REALM_PREFIXES = ['/', '/about', '/timeline', '/events', '/guides', '/alliances', '/chronometer', '/gate'];

function isRealm(pathname) {
  if (pathname === '/') return true;
  return REALM_PREFIXES.slice(1).some((prefix) => pathname.startsWith(prefix));
}

export default function SiteAtmosphere() {
  const pathname = usePathname();
  const realm = isRealm(pathname);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      root.style.setProperty('--site-scroll', '0');
      root.style.setProperty('--site-pointer-x', '0');
      root.style.setProperty('--site-pointer-y', '0');
      return;
    }

    let frame = 0;
    const updateScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty('--site-scroll', String(Math.min(window.scrollY, 2200)));
      });
    };
    const updatePointer = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty('--site-pointer-x', x.toFixed(3));
      root.style.setProperty('--site-pointer-y', y.toFixed(3));
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', updatePointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', updatePointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={`site-atmosphere ${realm ? 'site-atmosphere-realm' : 'site-atmosphere-console'}`} aria-hidden="true">
      <div className="site-atmosphere-glow" />
      <div className="site-atmosphere-ridge site-atmosphere-ridge-back" />
      <div className="site-atmosphere-ridge site-atmosphere-ridge-front" />
      <div className="site-atmosphere-grain" />
    </div>
  );
}
