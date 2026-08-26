'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { detectQuality, detectWebGL, prefersReducedMotion, wantsDataSaver } from './gateCapabilities';

const GateScene = dynamic(() => import('./GateScene'), { ssr: false });

// The decorative, non-interactive homepage backdrop - not the cinematic
// itself (that's /gate, still the full GateExperience). This is what "the
// Gate demoted to a conditional background layer" means concretely:
//
//   - Never blocks or delays the real page content in front of it. The
//     gradient fallback (.gate-fallback-art, the same one GateExperience
//     already uses for its own no-WebGL case) renders immediately and
//     stays if the scene doesn't qualify to mount - there is no
//     loading spinner or layout shift waiting on a decision.
//   - Only mounts the three.js scene at >=768px, prefers-reduced-motion:
//     no-preference, no Save-Data header, and a device that isn't
//     memory-constrained (detectQuality() !== 'mobile') - the four gates
//     the plan calls for, checked once on mount rather than re-evaluated
//     on resize (a homepage backdrop doesn't need to react to a live
//     device-tier change mid-visit).
//   - phase="idle", hovered/chosen=null: GateScene's static resting
//     state, no travel animation, no click targets. aria-hidden and
//     pointer-events:none throughout, so it never competes with the
//     real content or nav sitting on top of it.
export default function GateBackdrop() {
  const [mountScene, setMountScene] = useState(false);
  const [quality, setQuality] = useState('standard');

  useEffect(() => {
    const q = detectQuality();
    const qualifies =
      window.innerWidth >= 768 &&
      !prefersReducedMotion() &&
      !wantsDataSaver() &&
      q !== 'mobile' &&
      detectWebGL();
    setQuality(q);
    setMountScene(qualifies);
  }, []);

  return (
    <div className="gate-backdrop" aria-hidden="true">
      <div className="gate-backdrop-art" />
      {mountScene && (
        <div className="gate-backdrop-canvas">
          <GateScene hovered={null} phase="idle" chosen={null} quality={quality} />
        </div>
      )}
      <div className="gate-backdrop-fade" />
    </div>
  );
}
