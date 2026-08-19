'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const KNIGHT_URL = 'https://raw.githubusercontent.com/ilrein/warptracker/main/public/models/knight.glb';

function findClip(names, pattern) {
  return names.find((name) => pattern.test(name)) || null;
}

const AnimatedKnightTraveler = forwardRef(function AnimatedKnightTraveler({ walking = false }, forwardedRef) {
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
    const walkName = findClip(names, /(walk|running|run)/i);
    const idleName = findClip(names, /(idle|stand)/i) || names[0];
    const nextName = walking ? (walkName || idleName) : idleName;
    if (!nextName || !actions[nextName]) return undefined;

    const next = actions[nextName];
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || name === nextName) return;
      action.fadeOut(0.18);
    });
    next.reset().setEffectiveTimeScale(walking ? 0.92 : 0.78).setEffectiveWeight(1).fadeIn(0.18).play();
    return () => next.fadeOut(0.12);
  }, [actions, names, walking]);

  return (
    <group ref={root} scale={scale}>
      <primitive object={model} />
    </group>
  );
});

useGLTF.preload(KNIGHT_URL);

export default AnimatedKnightTraveler;
