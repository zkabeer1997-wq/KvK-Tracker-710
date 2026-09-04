'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ForgeLoader from './ForgeLoader';
import SceneOverlay from './SceneOverlay';
import { detectWebGL } from './world/gateCapabilities';

const KingdomScene = dynamic(() => import('./KingdomScene'), { ssr: false });

export default function KingdomEntrance() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [forging, setForging] = useState(true);
  const [webglOk, setWebglOk] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredRoad, setHoveredRoad] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | transitioning
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [transitionLabel, setTransitionLabel] = useState('');
  const navigateTimer = useRef(null);

  useEffect(() => {
    setWebglOk(detectWebGL());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    setReady(true);
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  const handleSelect = useCallback((road, href) => {
    if (phase === 'transitioning') return;
    setSelectedRoad(road);
    setTransitionLabel(road === 'left' ? 'TAKING THE GOLDEN ROAD' : 'PASSING THE INNER GATE');
    setPhase('transitioning');
    const duration = reducedMotion ? 350 : 1500;
    navigateTimer.current = setTimeout(() => {
      router.push(href);
    }, duration);
  }, [phase, reducedMotion, router]);

  if (!ready) {
    return <div className="kingdom-root kingdom-root-blank" aria-hidden="true" />;
  }

  // Static, accessible fallback when WebGL is unavailable.
  if (!webglOk) {
    return (
      <div className="kingdom-root kingdom-fallback">
        <div className="kingdom-fallback-inner">
          <span className="kingdom-eyebrow">Kingdom 710 &middot; Kingshot</span>
          <h1 className="kingdom-title">The gates of Kingdom 710</h1>
          <p>Choose your road into the kingdom.</p>
          <div className="kingdom-roads kingdom-roads-static">
            <Link href="/interest" className="kingdom-road kingdom-road-gold">
              <span className="road-kicker">The Golden Road</span>
              <span className="road-title">Request Entry</span>
              <span className="road-sub">Petition for transfer into Kingdom 710</span>
            </Link>
            <Link href="/player-record" className="kingdom-road kingdom-road-blue">
              <span className="road-kicker">The Inner Gate</span>
              <span className="road-title">Enter Kingdom</span>
              <span className="road-sub">Members report to the inner checkpoint</span>
            </Link>
          </div>
          <a href="#dossier" className="kingdom-explore">Explore Kingdom 710 &darr;</a>
        </div>
      </div>
    );
  }

  return (
    <div className="kingdom-root">
      {forging && <ForgeLoader reducedMotion={reducedMotion} onDone={() => setForging(false)} />}

      {!reducedMotion && (
        <div className="kingdom-canvas-wrap" aria-hidden="true">
          <KingdomScene hoveredRoad={hoveredRoad} phase={phase} selectedRoad={selectedRoad} />
        </div>
      )}
      {reducedMotion && <div className="kingdom-static-bg" aria-hidden="true" />}

      <SceneOverlay
        hoveredRoad={hoveredRoad}
        onHover={setHoveredRoad}
        onSelect={handleSelect}
        phase={phase}
      />

      <div className={`kingdom-transition-veil${phase === 'transitioning' ? ' active' : ''}`}>
        {phase === 'transitioning' && <span>{transitionLabel}</span>}
      </div>
    </div>
  );
}
