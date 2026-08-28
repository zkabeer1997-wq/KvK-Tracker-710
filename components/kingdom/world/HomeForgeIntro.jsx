'use client';

import { useEffect, useState } from 'react';
import ForgeSequence from './ForgeSequence';
import { useLanguage } from '../../i18n/LanguageProvider';

// The Sigil Forge cinematic (ForgeSequence, unchanged) used to be the
// entire homepage before PR 5 gave "/" real server-rendered content. This
// brings the cinematic back as a one-time overlay in front of that
// content rather than reverting the homepage itself - ForgeSequence is
// already a fixed, full-viewport layer (see .forge2 in kingdom.css), so it
// covers the page without affecting what crawlers or a skip/reduced-motion
// visitor see underneath. Gated on hasChosenLanguage, same as
// GateExperience.jsx, so it never stacks on top of the language picker.
export default function HomeForgeIntro() {
  const { hasChosenLanguage } = useLanguage();
  const [reduced, setReduced] = useState(false);
  const [forging, setForging] = useState(true);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (!forging || !hasChosenLanguage) return null;

  return <ForgeSequence reducedMotion={reduced} onDone={() => setForging(false)} />;
}
