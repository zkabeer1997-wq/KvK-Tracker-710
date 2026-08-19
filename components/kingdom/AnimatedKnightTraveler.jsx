'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const KNIGHT_URL = '/api/kingdom-assets/knight';

function findClip(names, patterns) {
  for (const pattern of patterns) {
    const match = names.find((name) => pattern.test(name));
    if (match) return match;
  }
  return null;
}

const AnimatedKnightTraveler = forwardRef(function AnimatedKnightTraveler({ movement = 'idle' }, forwardedRef) {
  const root = useRef(null);
  const gltf = useGLTF(KNIGHT_URL);
  const model = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const { actions, names } = useAnimations(gltf.animations, root);

  const scale = useMemo(() => {
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    return 1.82 / Math.max(0.001, size.y);
  }, [model]);

  useImperativeHandle(forwardedRef, () => root.current);

  useEffect(() => {
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!material) return;
        material.opacity = 1;
        material.transparent = false;
        material.depthWrite = true;
      });
    });
  }, [model]);

  useEffect(() => {
    const idleName = findClip(names, [/(^|[|_\s])idle($|[|_\s])/i, /stand/i]) || names[0];
    const walkName = findClip(names, [/(^|[|_\s])walk(ing)?($|[|_\s])/i, /walk/i]);
    const runName = findClip(names, [/(^|[|_\s])run(ning)?($|[|_\s])/i, /run/i]);

    const nextName = movement === 'run'
      ? (runName || walkName || idleName)
      : movement === 'walk'
        ? (walkName || runName || idleName)
        : idleName;

    if (!nextName || !actions[nextName]) return undefined;

    const next = actions[nextName];
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || name === nextName) return;
      action.fadeOut(0.16);
    });

    const timeScale = movement === 'run' ? 1.06 : movement === 'walk' ? 0.86 : 0.72;
    next
      .reset()
      .setEffectiveTimeScale(timeScale)
      .setEffectiveWeight(1)
      .fadeIn(0.18)
      .play();

    return () => next.fadeOut(0.1);
  }, [actions, names, movement]);

  return (
    <group ref={root} scale={scale}>
      <primitive object={model} />
    </group>
  );
});

useGLTF.preload(KNIGHT_URL);

export default AnimatedKnightTraveler;
