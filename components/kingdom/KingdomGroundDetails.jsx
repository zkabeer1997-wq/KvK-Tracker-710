'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const GOLD = '#e2b75c';
const BLUE = '#8fb9ee';
const GROUND = '#0a1430';

function Road({ side, color, active, selected }) {
  const direction = side === 'left' ? -1 : 1;
  const stones = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const t = index / 11;
    const curve = t * t;
    return {
      x: direction * (0.08 + curve * 4.45),
      z: 5.05 - t * 13.6,
      rotation: direction * t * 0.31,
      width: 1.32 + t * 0.92,
    };
  }), [direction]);

  const emissive = selected ? 0.32 : active ? 0.12 : 0.015;
  return (
    <group>
      {stones.map((stone, index) => (
        <mesh
          key={index}
          position={[stone.x, 0.015, stone.z]}
          rotation={[0, stone.rotation, 0]}
          receiveShadow
        >
          <boxGeometry args={[stone.width, 0.075, 0.86]} />
          <meshStandardMaterial
            color={index % 2 ? '#29395d' : '#324469'}
            roughness={0.98}
            emissive={color}
            emissiveIntensity={emissive}
          />
        </mesh>
      ))}
    </group>
  );
}

function Brazier({ position, color, active }) {
  const light = useRef(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    light.current.intensity = (active ? 2.6 : 1.25) + Math.sin(clock.getElapsedTime() * 7.3 + position[0]) * 0.08;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.19, 0.38, 10]} />
        <meshStandardMaterial color="#252c3e" metalness={0.42} roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.65, 0]} color={color} intensity={1.4} distance={6} decay={2} />
    </group>
  );
}

function Rock({ position, scale, rotation }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#263556" roughness={1} />
    </mesh>
  );
}

function PineSilhouette({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 2, 7]} />
        <meshStandardMaterial color="#192233" roughness={1} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow>
        <coneGeometry args={[0.72, 2.45, 9]} />
        <meshStandardMaterial color="#1a2d35" roughness={1} />
      </mesh>
      <mesh position={[0, 3.0, 0]} castShadow>
        <coneGeometry args={[0.52, 1.75, 9]} />
        <meshStandardMaterial color="#203841" roughness={1} />
      </mesh>
    </group>
  );
}

export default function KingdomGroundDetails({ hoveredRoad, selectedRoad, mobile = false }) {
  const leftActive = hoveredRoad === 'left' || selectedRoad === 'left';
  const rightActive = hoveredRoad === 'right' || selectedRoad === 'right';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -3]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>

      <Road side="left" color={GOLD} active={leftActive} selected={selectedRoad === 'left'} />
      <Road side="right" color={BLUE} active={rightActive} selected={selectedRoad === 'right'} />

      <Brazier position={[-1.35, 0.02, 2.35]} color={GOLD} active={leftActive} />
      <Brazier position={[1.35, 0.02, 2.35]} color={BLUE} active={rightActive} />

      <Rock position={[-6.8, 0.32, 4.8]} scale={[1.45, 0.62, 1]} rotation={[0.08, 0.4, -0.08]} />
      <Rock position={[6.5, 0.28, 5.6]} scale={[1.15, 0.5, 0.9]} rotation={[0.14, -0.3, 0.1]} />
      <Rock position={[-8.7, 0.38, -1.8]} scale={[1.4, 0.68, 1.08]} rotation={[0.12, -0.2, 0.16]} />
      <Rock position={[8.9, 0.34, -1.5]} scale={[1.25, 0.56, 0.95]} rotation={[0.08, 0.5, -0.08]} />

      {!mobile && (
        <>
          <PineSilhouette position={[-10.7, 0, 3.6]} scale={1.25} />
          <PineSilhouette position={[10.9, 0, 3.1]} scale={1.32} />
          <PineSilhouette position={[-12.7, 0, -4.5]} scale={1.55} />
          <PineSilhouette position={[12.8, 0, -4.1]} scale={1.48} />
        </>
      )}

      {[
        [-18, -27, 6.2], [-9, -31, 7.2], [0, -34, 8.6], [10, -30, 6.9], [19, -26, 5.8],
      ].map(([x, z, size], index) => (
        <mesh key={index} position={[x, size / 2 - 1.1, z]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[size * 1.05, size, 4]} />
          <meshStandardMaterial color={index === 2 ? '#0b1125' : '#0d1630'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
