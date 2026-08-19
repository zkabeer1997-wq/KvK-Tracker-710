'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ForgeLoader from './ForgeLoader';
import SceneOverlay from './SceneOverlay';
import styles from './KingdomEntrance.module.css';

const KingdomScene = dynamic(() => import('./KingdomScene'), { ssr: false });

function detectWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function KingdomEntrance() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [forging, setForging] = useState(true);
  const [webglOk, setWebglOk] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredRoad, setHoveredRoad] = useState(null);
  const [phase, setPhase] = useState('approach');
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [transitionLabel, setTransitionLabel] = useState('');
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => {
    setWebglOk(detectWebGL());
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    updateMotion();
    motionQuery.addEventListener?.('change', updateMotion);
    setReady(true);

    return () => {
      clearTimers();
      motionQuery.removeEventListener?.('change', updateMotion);
    };
  }, [clearTimers]);

  const finishForge = useCallback(() => {
    setForging(false);
    if (reducedMotion) {
      setPhase('idle');
      return;
    }
    setPhase('approach');
    const timer = setTimeout(() => setPhase('idle'), 2200);
    timers.current.push(timer);
  }, [reducedMotion]);

  const handleSelect = useCallback((road, href) => {
    if (phase === 'transitioning') return;
    clearTimers();
    setSelectedRoad(road);
    setHoveredRoad(road);
    setTransitionLabel(road === 'left' ? 'Following the golden road' : 'Entering the member gate');
    setPhase('transitioning');

    const duration = reducedMotion ? 300 : 1250;
    const timer = setTimeout(() => router.push(href), duration);
    timers.current.push(timer);
  }, [clearTimers, phase, reducedMotion, router]);

  if (!ready) {
    return <div className={`${styles.root} ${styles.blank}`} aria-hidden="true" />;
  }

  if (!webglOk) {
    return (
      <section className={`${styles.root} ${styles.fallback}`} aria-label="Kingdom 710 entrance">
        <div className={styles.fallbackInner}>
          <span className={styles.eyebrow}>Kingdom 710 · Choose your path</span>
          <h1 className={styles.title}>Enter the kingdom</h1>
          <p className={styles.lede}>Choose the option that describes you. We will take you to the right place.</p>
          <div className={`${styles.choices} ${styles.fallbackChoices}`}>
            <button type="button" className={`${styles.choice} ${styles.choiceGold}`} onClick={() => router.push('/interest')}>
              <span className={styles.choiceNumber}>01</span>
              <span><span className={styles.choiceKicker}>New to K710? Start here</span><span className={styles.choiceTitle}>Request Entry</span><span className={styles.choiceSub}>Apply to transfer into Kingdom 710.</span></span>
              <span className={styles.choiceArrow}>→</span>
            </button>
            <button type="button" className={`${styles.choice} ${styles.choiceBlue}`} onClick={() => router.push('/player-record')}>
              <span className={styles.choiceNumber}>02</span>
              <span><span className={styles.choiceKicker}>Already in K710?</span><span className={styles.choiceTitle}>Enter Member Hub</span><span className={styles.choiceSub}>Open member tools and rally records.</span></span>
              <span className={styles.choiceArrow}>→</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root} aria-label="Interactive Kingdom 710 entrance">
      {forging && <ForgeLoader reducedMotion={reducedMotion} onDone={finishForge} />}

      {!reducedMotion ? (
        <div className={styles.canvasWrap} aria-hidden="true">
          <KingdomScene
            hoveredRoad={hoveredRoad}
            phase={phase}
            selectedRoad={selectedRoad}
            active={!forging}
          />
        </div>
      ) : (
        <div className={styles.staticBg} aria-hidden="true" />
      )}

      <div className={styles.vignette} aria-hidden="true" />
      <SceneOverlay
        hoveredRoad={hoveredRoad}
        onHover={setHoveredRoad}
        onSelect={handleSelect}
        phase={phase}
      />

      <div className={`${styles.transitionVeil} ${phase === 'transitioning' ? styles.transitionVeilActive : ''}`} aria-hidden="true">
        {phase === 'transitioning' && <span className={styles.transitionLabel}>{transitionLabel}</span>}
      </div>
    </section>
  );
}
