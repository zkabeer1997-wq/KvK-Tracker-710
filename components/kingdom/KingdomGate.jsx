'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

const GOLD = '#d9a94e';
const EMBER = '#d9622d';
const BLUE = '#5c86c9';
const STONE = '#232a45';
const STONE_DARK = '#171c33';

function Torch({ position, color = EMBER, intensity = 2.2 }) {
  const light = useRef(null);
  const seed = useRef(Math.random() * 10);
  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.getElapsedTime() + seed.current;
    light.current.intensity = intensity + Math.sin(t * 9) * 0.35 + Math.sin(t * 3.1) * 0.2;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.4, 6]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.85, 0]} color={color} intensity={intensity} distance={6} decay={2} />
    </group>
  );
}

function Tower({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.1, 0]} castShadow={false}>
        <cylinderGeometry args={[0.95, 1.15, 4.2, 8]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.5, 8]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.95} />
      </mesh>
      <mesh position={[0, 5.15, 0]}>
        <coneGeometry args={[1.05, 1.3, 8]} />
        <meshStandardMaterial color="#0d1119" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Banner({ position, color }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.4 + position[0]) * 0.12;
  });
  return (
    <group position={position} ref={ref}>
      <mesh position={[0, -0.9, 0]}>
        <planeGeometry args={[0.55, 1.8]} />
        <meshStandardMaterial color={color} side={2} roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function KingdomGate() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial color="#0c1024" roughness={1} />
      </mesh>

      {/* Central gate wall */}
      <mesh position={[0, 2.6, -6]}>
        <boxGeometry args={[9, 5.2, 1.1]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      {/* Gate arch opening (dark) */}
      <mesh position={[0, 1.7, -5.9]}>
        <boxGeometry args={[2.6, 3.4, 1]} />
        <meshStandardMaterial color="#050810" roughness={1} />
      </mesh>
      {/* Warm glow spilling from the gate */}
      <pointLight position={[0, 1.6, -5.2]} color={GOLD} intensity={3.5} distance={10} decay={2} />
      <rectAreaLight position={[0, 1.7, -5.7]} width={2.4} height={3} color={GOLD} intensity={2.5} />

      {/* Flanking towers */}
      <Tower position={[-5.6, 0, -6.3]} />
      <Tower position={[5.6, 0, -6.3]} />

      {/* Side walls receding */}
      <mesh position={[-9.5, 2, -7.5]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[7, 4, 0.9]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} />
      </mesh>
      <mesh position={[9.5, 2, -7.5]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[7, 4, 0.9]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} />
      </mesh>

      {/* Distant mountain silhouettes */}
      {[[-14, -22, 4.4], [-6, -26, 6], [5, -27, 5.6], [13, -23, 4.8], [20, -20, 4]].map((m, i) => (
        <mesh key={i} position={[m[0], m[2] / 2 - 0.4, m[1]]}>
          <coneGeometry args={[m[2] * 1.1, m[2], 4]} />
          <meshStandardMaterial color="#0a0d1c" roughness={1} />
        </mesh>
      ))}

      {/* Torches lining the approach */}
      <Torch position={[-2.4, 0.2, -3.5]} color={EMBER} />
      <Torch position={[2.4, 0.2, -3.5]} color={EMBER} />
      <Torch position={[-3.6, 0.2, 0]} color={GOLD} />
      <Torch position={[3.6, 0.2, 0]} color={BLUE} intensity={1.6} />
      <Torch position={[-4.6, 0.2, 3.5]} color={GOLD} />
      <Torch position={[4.6, 0.2, 3.5]} color={BLUE} intensity={1.6} />

      {/* Banners on towers */}
      <Banner position={[-5.6, 4.9, -6.3]} color={GOLD} />
      <Banner position={[5.6, 4.9, -6.3]} color={EMBER} />

      {/* Path stones down the center */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0, 0.02, 6 - i * 1.4]} rotation={[-Math.PI / 2, 0, i * 0.3]}>
          <planeGeometry args={[1.1, 0.7]} />
          <meshStandardMaterial color="#1a2038" roughness={1} />
        </mesh>
      ))}

      {/* Ember / firefly particles for atmosphere */}
      <Sparkles count={70} scale={[16, 6, 14]} position={[0, 2, -2]} size={2.4} speed={0.25} color={EMBER} opacity={0.55} />
    </group>
  );
}
