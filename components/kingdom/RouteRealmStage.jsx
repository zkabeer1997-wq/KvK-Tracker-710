'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const RouteRealmCanvas = dynamic(() => import('./RouteRealmCanvas'), {
  ssr: false,
  loading: () => <div className="route-realm-loading" aria-hidden="true" />,
});

const PUBLIC_REALMS = [
  {
    test: (path) => path === '/interest',
    id: 'outer-gate',
    district: 'The Outer Gate',
    title: 'Petition for Entry',
    description: 'Cross the transfer causeway and present your banner to Kingdom 710.',
    accent: '#e2b75c',
    secondary: '#8fb9ee',
  },
  {
    test: (path) => path === '/player-record',
    id: 'inner-keep',
    district: 'The Inner Keep',
    title: 'Member Checkpoint',
    description: 'Beyond the outer walls, the member keep opens into the kingdom command network.',
    accent: '#8fb9ee',
    secondary: '#e2b75c',
  },
  {
    test: (path) => path.startsWith('/player-record/form'),
    id: 'training-yard',
    district: 'The Training Yard',
    title: 'Rally Muster',
    description: 'Standards, troop lines, and rally assignments converge in the kingdom muster yard.',
    accent: '#9aba87',
    secondary: '#e2b75c',
  },
  {
    test: (path) => path.startsWith('/power-profile'),
    id: 'armory',
    district: 'The Royal Armory',
    title: 'War Ledger',
    description: 'Governor gear, charms, heroes, and power are recorded beneath the armory vaults.',
    accent: '#e2b75c',
    secondary: '#9dbcf1',
  },
  {
    test: (path) => path.startsWith('/prep-phase-backpack'),
    id: 'ministers-hall',
    district: 'The Ministers’ Hall',
    title: 'Council Appointments',
    description: 'Plan construction, research, training, and the windows that power the next preparation phase.',
    accent: '#c5a0ef',
    secondary: '#e2b75c',
  },
  {
    test: (path) => path.startsWith('/flamedragon'),
    id: 'dragon-forge',
    district: 'The Dragon Forge',
    title: 'Flamedragon Tyrant',
    description: 'Enter the forge district where battle readiness is tempered before the tyrant arrives.',
    accent: '#f08b58',
    secondary: '#e2b75c',
  },
];

function adminRealm(path) {
  if (!path.startsWith('/admin')) return null;

  if (path.includes('/interest')) {
    return {
      id: 'war-room',
      district: 'Command Hall · Transfer Council',
      title: 'Transfer Council',
      description: 'Review petitions, compare candidates, and decide who reaches the gate.',
      accent: '#e2b75c',
      secondary: '#8fb9ee',
      compact: true,
    };
  }

  if (path.includes('/prep-ministers')) {
    return {
      id: 'war-room',
      district: 'Command Hall · Minister Board',
      title: 'Minister Operations',
      description: 'Coordinate the kingdom schedule from the command table.',
      accent: '#c5a0ef',
      secondary: '#e2b75c',
      compact: true,
    };
  }

  if (path.includes('/flamedragon')) {
    return {
      id: 'war-room',
      district: 'Command Hall · Dragon Desk',
      title: 'Dragon Command',
      description: 'Track readiness and assignments before the forge district goes to war.',
      accent: '#f08b58',
      secondary: '#e2b75c',
      compact: true,
    };
  }

  return {
    id: 'war-room',
    district: path.includes('/login') ? 'The Command Hall' : 'Command Hall · War Room',
    title: path.includes('/login') ? 'Leadership Access' : 'Kingdom Command',
    description: path.includes('/login')
      ? 'Leadership enters through a guarded inner chamber.'
      : 'Roster intelligence, rally planning, and kingdom operations meet at one strategic table.',
    accent: '#e2b75c',
    secondary: '#8fb9ee',
    compact: true,
  };
}

function getRealm(path) {
  if (!path || path === '/') return null;
  const publicRealm = PUBLIC_REALMS.find((realm) => realm.test(path));
  if (publicRealm) return publicRealm;
  const admin = adminRealm(path);
  if (admin) return admin;
  return {
    id: 'frontier',
    district: 'Kingdom 710',
    title: 'Beyond the Walls',
    description: 'The kingdom continues beyond the mapped districts.',
    accent: '#e2b75c',
    secondary: '#8fb9ee',
  };
}

export default function RouteRealmStage() {
  const pathname = usePathname();
  const realm = useMemo(() => getRealm(pathname), [pathname]);
  const stageRef = useRef(null);
  const [active, setActive] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (realm?.id) {
      document.body.dataset.realm = realm.id;
    } else {
      delete document.body.dataset.realm;
    }
    return () => {
      delete document.body.dataset.realm;
    };
  }, [realm?.id]);

  useEffect(() => {
    setActive(true);
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '120px 0px 120px 0px', threshold: 0.02 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [realm?.id]);

  if (!realm) return null;

  return (
    <section
      ref={stageRef}
      className={`route-realm-stage route-realm-${realm.id}${realm.compact ? ' route-realm-compact' : ''}`}
      aria-labelledby="route-realm-title"
      data-active={active ? 'true' : 'false'}
    >
      <div key={`scene-${pathname}`} className="route-realm-canvas route-realm-reveal" aria-hidden="true">
        <RouteRealmCanvas
          realm={realm.id}
          accent={realm.accent}
          secondary={realm.secondary}
          active={active}
          reducedMotion={reducedMotion}
        />
      </div>
      <div className="route-realm-vignette" aria-hidden="true" />
      <div key={`copy-${pathname}`} className="route-realm-copy route-realm-copy-reveal">
        <span className="route-realm-district">{realm.district}</span>
        <h2 id="route-realm-title">{realm.title}</h2>
        <p>{realm.description}</p>
        <span className="route-realm-hint" aria-hidden="true">
          {reducedMotion ? '3D district view' : 'Move your pointer to survey the district'}
        </span>
      </div>
      <div className="route-realm-seal" aria-hidden="true">
        <span>710</span>
      </div>
    </section>
  );
}
