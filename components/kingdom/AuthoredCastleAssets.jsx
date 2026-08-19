'use client';

import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { Box3, Color, MeshStandardMaterial, Vector3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const BASE = 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/castle-kit-1.0/Models';
const ASSETS = {
  gatehouse: `${BASE}/wallNarrowGate.obj`,
  wall: `${BASE}/wallNarrow.obj`,
  trebuchet: `${BASE}/siegeTrebuchet.obj`,
  sword: `${BASE}/sword.obj`,
  sentry: `${BASE}/knightBlue.obj`,
};

function AuthoredModel({
  name,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  targetHeight = 4,
  color = '#596b92',
  metalness = 0.04,
  roughness = 0.9,
  emissive = '#000000',
  emissiveIntensity = 0,
  opacity = 1,
  castShadow = true,
  receiveShadow = true,
}) {
  const source = useLoader(OBJLoader, ASSETS[name]);

  const prepared = useMemo(() => {
    const root = source.clone(true);
    const bounds = new Box3().setFromObject(root);
    const center = bounds.getCenter(new Vector3());
    const height = Math.max(0.001, bounds.max.y - bounds.min.y);
    const material = new MeshStandardMaterial({
      color: new Color(color),
      roughness,
      metalness,
      emissive: new Color(emissive),
      emissiveIntensity,
      transparent: opacity < 1,
      opacity,
    });

    root.position.set(-center.x, -bounds.min.y, -center.z);
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.material = material;
      object.castShadow = castShadow;
      object.receiveShadow = receiveShadow;
    });

    return { root, scale: targetHeight / height };
  }, [source, targetHeight, color, metalness, roughness, emissive, emissiveIntensity, opacity, castShadow, receiveShadow]);

  return (
    <group position={position} rotation={rotation} scale={prepared.scale}>
      <primitive object={prepared.root} />
    </group>
  );
}

export function AuthoredEntranceArchitecture({ activeRoad, mobile = false }) {
  const leftActive = activeRoad === 'left';
  const rightActive = activeRoad === 'right';
  return (
    <group position={[0, 0, -0.15]}>
      <AuthoredModel name="gatehouse" position={[-4.55, 0, -8.7]} rotation={[0, 0, 0]} targetHeight={7.15} color={leftActive ? '#7182aa' : '#5b6c94'} />
      <AuthoredModel name="gatehouse" position={[4.55, 0, -8.7]} rotation={[0, Math.PI, 0]} targetHeight={7.15} color={rightActive ? '#7182aa' : '#5b6c94'} />
      {!mobile && (
        <>
          <AuthoredModel name="wall" position={[-10.15, 0, -9.1]} targetHeight={6.25} color="#4b5c82" />
          <AuthoredModel name="wall" position={[10.15, 0, -9.1]} rotation={[0, Math.PI, 0]} targetHeight={6.25} color="#4b5c82" />
          <AuthoredModel name="trebuchet" position={[-10.5, 0, -1.7]} rotation={[0, 0.42, 0]} targetHeight={2.55} color="#57443b" roughness={0.84} />
          <AuthoredModel name="sentry" position={[9.3, 0, -3.4]} rotation={[0, -0.35, 0]} targetHeight={1.78} color="#344e78" roughness={0.74} />
        </>
      )}
    </group>
  );
}

export function AuthoredDistrictArchitecture({ realm, accent = '#e2b75c', secondary = '#8fb9ee', mobile = false }) {
  const stone = realm === 'dragon-forge' ? '#56465c' : realm === 'ministers-hall' ? '#5a5b82' : '#52658e';
  const gateHeight = realm === 'war-room' ? 5.5 : 6.25;
  const gateZ = realm === 'war-room' ? -5.7 : -5.1;
  const accentGlow = realm === 'dragon-forge' ? '#6a2818' : '#111a32';

  return (
    <group>
      <AuthoredModel
        name="gatehouse"
        position={[1.5, 0, gateZ]}
        rotation={[0, Math.PI * 0.04, 0]}
        targetHeight={gateHeight}
        color={stone}
        emissive={accentGlow}
        emissiveIntensity={realm === 'dragon-forge' ? 0.16 : 0.035}
      />
      {!mobile && (
        <>
          <AuthoredModel name="wall" position={[-5.9, 0, -5.5]} targetHeight={5.2} color="#43557d" />
          <AuthoredModel name="wall" position={[8.6, 0, -6.1]} rotation={[0, Math.PI, 0]} targetHeight={5.0} color="#405176" />
        </>
      )}

      {(realm === 'training-yard' || realm === 'war-room') && (
        <AuthoredModel name="trebuchet" position={[5.8, 0, -0.5]} rotation={[0, -0.62, 0]} targetHeight={2.35} color="#5d4639" roughness={0.82} />
      )}
      {realm === 'armory' && (
        <AuthoredModel name="sword" position={[5.5, 0.42, -0.4]} rotation={[0.18, 0, -0.76]} targetHeight={2.35} color="#b9c5d9" metalness={0.7} roughness={0.28} emissive={accent} emissiveIntensity={0.08} />
      )}
      {(realm === 'outer-gate' || realm === 'inner-keep' || realm === 'war-room') && !mobile && (
        <AuthoredModel name="sentry" position={[5.25, 0, 0.2]} rotation={[0, -0.25, 0]} targetHeight={1.72} color={secondary} roughness={0.7} />
      )}
    </group>
  );
}

export { AuthoredModel };
