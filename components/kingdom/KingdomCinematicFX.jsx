'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { AdditiveBlending, DoubleSide } from 'three';

function LightShaft({ position, rotation, color, opacity = 0.03, scale = [1, 1, 1] }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} renderOrder={-1}>
      <coneGeometry args={[3.6, 15, 28, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={DoubleSide}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function Raven({ offset, scale = 1 }) {
  const root = useRef(null);
  const phase = useRef(offset[0] * 0.41 + offset[2] * 0.23);

  useFrame(({ clock }) => {
    if (!root.current) return;
    const t = clock.getElapsedTime() * 0.42 + phase.current;
    root.current.position.x = offset[0] + Math.sin(t * 0.75) * 1.8;
    root.current.position.y = offset[1] + Math.sin(t * 1.3) * 0.28;
    root.current.position.z = offset[2] + Math.cos(t * 0.62) * 0.8;
    root.current.rotation.y = -0.4 + Math.sin(t * 0.75) * 0.15;
    const flap = Math.sin(t * 8.5) * 0.32;
    if (root.current.children[0]) root.current.children[0].rotation.z = 0.32 + flap;
    if (root.current.children[1]) root.current.children[1].rotation.z = -0.32 - flap;
  });

  return (
    <group ref={root} position={offset} scale={scale}>
      <mesh position={[-0.11, 0, 0]} rotation={[0, 0, 0.32]}>
        <planeGeometry args={[0.28, 0.08]} />
        <meshBasicMaterial color="#09101f" side={DoubleSide} />
      </mesh>
      <mesh position={[0.11, 0, 0]} rotation={[0, 0, -0.32]}>
        <planeGeometry args={[0.28, 0.08]} />
        <meshBasicMaterial color="#09101f" side={DoubleSide} />
      </mesh>
    </group>
  );
}

function RavenFlock() {
  const birds = useMemo(() => [
    [-7.8, 7.2, -24, 0.9],
    [-5.2, 8.1, -28, 0.7],
    [-2.8, 7.6, -26, 0.74],
    [4.4, 8.5, -30, 0.68],
    [7.2, 7.5, -25, 0.82],
  ], []);

  return (
    <group>
      {birds.map(([x, y, z, scale], index) => (
        <Raven key={index} offset={[x, y, z]} scale={scale} />
      ))}
    </group>
  );
}

export default function KingdomCinematicFX({ activeRoad, mobile }) {
  const leftActive = activeRoad === 'left';
  const rightActive = activeRoad === 'right';

  return (
    <>
      <LightShaft
        position={[-8.8, 8.6, -17]}
        rotation={[0.05, 0.02, -0.58]}
        color="#c5d7fa"
        opacity={leftActive ? 0.052 : 0.028}
        scale={[0.86, 1.18, 0.86]}
      />
      <LightShaft
        position={[8.6, 8.0, -18]}
        rotation={[0.02, -0.03, 0.55]}
        color={rightActive ? '#a9c9ff' : '#b7c8ec'}
        opacity={rightActive ? 0.052 : 0.026}
        scale={[0.9, 1.14, 0.9]}
      />
      <spotLight
        position={[-9, 11, 2]}
        target-position={[-4, 1.4, -8]}
        angle={0.32}
        penumbra={0.9}
        intensity={leftActive ? 2.25 : 0.82}
        color="#e7bd67"
        distance={30}
        decay={2}
      />
      <spotLight
        position={[9, 11, 2]}
        target-position={[4, 1.4, -8]}
        angle={0.32}
        penumbra={0.9}
        intensity={rightActive ? 2.1 : 0.76}
        color="#9ebef1"
        distance={30}
        decay={2}
      />
      {!mobile && <RavenFlock />}
      <Sparkles
        count={mobile ? 18 : 34}
        position={[0, 1.0, 4.2]}
        scale={[9, 1.7, 5.5]}
        size={0.85}
        speed={0.16}
        color={leftActive ? '#e4b85b' : rightActive ? '#9ebef1' : '#c8d2e8'}
        opacity={0.24}
      />
    </>
  );
}
