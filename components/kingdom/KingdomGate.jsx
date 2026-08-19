'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { AdditiveBlending, CanvasTexture } from 'three';

// Radial-gradient sprite texture. A uniformly-opaque sphere reads as a hard
// disc; a gradient sprite gives real falloff so torches look like light.
function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(c);
  }, []);
}

const GOLD = '#d9a94e';
const EMBER = '#d9622d';
// Restrained steel-blue for the inner/member path: cool, not a saturated
// primary, so it reads as cold torchlight rather than a UI dot.
const BLUE = '#6f8bb8';
const STONE = '#3a4470';
const STONE_DARK = '#2a3358';

// A flame is a small near-white core wrapped in additive falloff, not a
// flat emissive disc -- a solid sphere at this scale reads as a UI artifact.
function Torch({ position, color = EMBER, intensity = 3.5 }) {
  const light = useRef(null);
  const halo = useRef(null);
  const core = useRef(null);
  const seed = useRef(Math.random() * 10);
  const glowTex = useGlowTexture();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed.current;
    const flicker = Math.sin(t * 9) * 0.35 + Math.sin(t * 3.1) * 0.2;
    if (light.current) light.current.intensity = intensity + flicker;
    if (halo.current) halo.current.scale.setScalar(1.5 + flicker * 0.18);
    if (core.current) core.current.scale.setScalar(1 + flicker * 0.06);
  });

  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.4, 6]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>

      {/* soft additive glow -- gradient sprite, so it falls off instead of
          ending on a hard circular edge */}
      {glowTex && (
        <sprite ref={halo} position={[0, 0.8, 0]} scale={[1.5, 1.5, 1.5]}>
          <spriteMaterial
            map={glowTex}
            color={color}
            transparent
            opacity={0.85}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}

      {/* small hot core */}
      <mesh ref={core} position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
      </mesh>

      <pointLight ref={light} position={[0, 0.85, 0]} color={color} intensity={intensity} distance={9} decay={2} />
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
