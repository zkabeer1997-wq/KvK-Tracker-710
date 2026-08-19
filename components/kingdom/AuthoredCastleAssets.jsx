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

function materialVariant(baseHex, sourceName, options) {
  const name = String(sourceName || '').toLowerCase();
  const base = new Color(baseHex);
  let factor = 1;
  let metalness = options.metalness;
  let roughness = options.roughness;

  if (name.includes('dark')) factor = 0.7;
  if (name.includes('wood')) {
    factor = 0.72;
    metalness = Math.min(metalness, 0.08);
    roughness = Math.max(roughness, 0.76);
  }
  if (name.includes('metal') || name.includes('iron')) {
    factor = 1.08;
    metalness = Math.max(metalness, 0.68);
    roughness = Math.min(roughness, 0.4);
  }
  if (name.includes('cotton') || name.includes('cloth')) {
    factor = 0.88;
    metalness = 0;
    roughness = 0.92;
  }
  if (name.includes('astronaut')) factor = 0.56;

  base.multiplyScalar(factor);
  return new MeshStandardMaterial({
    color: base,
    roughness,
    metalness,
    emissive: new Color(options.emissive),
    emissiveIntensity: options.emissiveIntensity,
    transparent: options.opacity < 1,
    opacity: options.opacity,
  });
}

function AuthoredModel({
  name,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  targetHeight = 4,
  color = '#747b90',
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
    const materials = new Map();

    root.position.set(-center.x, -bounds.min.y, -center.z);
    root.traverse((object) => {
      if (!object.isMesh) return;
      const original = Array.isArray(object.material) ? object.material[0] : object.material;
      const materialName = original?.name || object.name || 'default';
      if (!materials.has(materialName)) {
        materials.set(materialName, materialVariant(color, materialName, {
          metalness,
          roughness,
          emissive,
          emissiveIntensity,
          opacity,
        }));
      }
      object.material = materials.get(materialName);
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
  const leftStone = leftActive ? '#858aa0' : '#73798f';
  const rightStone = rightActive ? '#858da5' : '#737b92';

  return (
    <group position={[0, 0, -0.15]}>
      <AuthoredModel name="gatehouse" position={[-4.55, 0, -8.7]} targetHeight={7.15} color={leftStone} />
      <AuthoredModel name="gatehouse" position={[4.55, 0, -8.7]} rotation={[0, Math.PI, 0]} targetHeight={7.15} color={rightStone} />
      {!mobile && (
        <>
          <AuthoredModel name="wall" position={[-10.15, 0, -9.1]} targetHeight={6.25} color="#666f88" />
          <AuthoredModel name="wall" position={[10.15, 0, -9.1]} rotation={[0, Math.PI, 0]} targetHeight={6.25} color="#666f88" />
          <AuthoredModel name="trebuchet" position={[-10.5, 0, -1.7]} rotation={[0, 0.42, 0]} targetHeight={2.55} color="#755c4b" roughness={0.82} />
          <AuthoredModel name="sentry" position={[9.3, 0, -3.4]} rotation={[0, -0.35, 0]} targetHeight={1.78} color="#55719d" roughness={0.7} />
        </>
      )}
    </group>
  );
}

export function AuthoredDistrictArchitecture({ realm, accent = '#e2b75c', secondary = '#8fb9ee', mobile = false }) {
  const stone = realm === 'dragon-forge' ? '#756c78' : realm === 'ministers-hall' ? '#77758b' : '#737c94';
  const gateHeight = realm === 'war-room' ? 5.5 : 6.25;
  const gateZ = realm === 'war-room' ? -5.7 : -5.1;
  const accentGlow = realm === 'dragon-forge' ? '#42190f' : '#0b1228';

  return (
    <group>
      <AuthoredModel
        name="gatehouse"
        position={[1.5, 0, gateZ]}
        rotation={[0, Math.PI * 0.04, 0]}
        targetHeight={gateHeight}
        color={stone}
        emissive={accentGlow}
        emissiveIntensity={realm === 'dragon-forge' ? 0.11 : 0.02}
      />
      {!mobile && (
        <>
          <AuthoredModel name="wall" position={[-5.9, 0, -5.5]} targetHeight={5.2} color="#626d87" />
          <AuthoredModel name="wall" position={[8.6, 0, -6.1]} rotation={[0, Math.PI, 0]} targetHeight={5.0} color="#5d6982" />
        </>
      )}

      {(realm === 'training-yard' || realm === 'war-room') && (
        <AuthoredModel name="trebuchet" position={[5.8, 0, -0.5]} rotation={[0, -0.62, 0]} targetHeight={2.35} color="#765a47" roughness={0.82} />
      )}
      {realm === 'armory' && (
        <AuthoredModel name="sword" position={[5.5, 0.42, -0.4]} rotation={[0.18, 0, -0.76]} targetHeight={2.35} color="#c1c9d8" metalness={0.74} roughness={0.26} emissive={accent} emissiveIntensity={0.06} />
      )}
      {(realm === 'outer-gate' || realm === 'inner-keep' || realm === 'war-room') && !mobile && (
        <AuthoredModel name="sentry" position={[5.25, 0, 0.2]} rotation={[0, -0.25, 0]} targetHeight={1.72} color={secondary} roughness={0.7} />
      )}
    </group>
  );
}

export { AuthoredModel };
