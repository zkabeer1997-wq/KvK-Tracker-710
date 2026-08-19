'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { AdditiveBlending, CanvasTexture, DoubleSide } from 'three';

const GOLD = '#d9a94e';
const GOLD_BRIGHT = '#f0c669';
const EMBER = '#d9622d';
const BLUE = '#7594c8';
const STONE = '#343d65';
const STONE_DARK = '#1c2443';
const GROUND = '#080c1c';

function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.24, 'rgba(255,255,255,0.58)');
    gradient.addColorStop(0.58, 'rgba(255,255,255,0.14)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);
}

function Torch({ position, color = EMBER, intensity = 3.2, scale = 1 }) {
  const light = useRef(null);
  const halo = useRef(null);
  const seed = useRef(Math.random() * 8);
  const glowTexture = useGlowTexture();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed.current;
    const flicker = Math.sin(t * 8.7) * 0.28 + Math.sin(t * 3.6) * 0.16;
    if (light.current) light.current.intensity = intensity + flicker;
    if (halo.current) halo.current.scale.setScalar((1.25 + flicker * 0.12) * scale);
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 1, 7]} />
        <meshStandardMaterial color="#171a27" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {glowTexture && (
        <sprite ref={halo} position={[0, 1.08, 0]} scale={[1.25, 1.25, 1.25]}>
          <spriteMaterial
            map={glowTexture}
            color={color}
            transparent
            opacity={0.86}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}
      <pointLight ref={light} position={[0, 1.05, 0]} color={color} intensity={intensity} distance={8} decay={2} />
    </group>
  );
}

function Banner({ position, color, flip = false }) {
  const group = useRef(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.25 + position[0]) * 0.10 + (flip ? Math.PI : 0);
  });

  return (
    <group ref={group} position={position}>
      <mesh position={[0, -0.78, 0]}>
        <planeGeometry args={[0.58, 1.56, 1, 5]} />
        <meshStandardMaterial color={color} side={DoubleSide} roughness={0.72} />
      </mesh>
    </group>
  );
}

function Tower({ position, height = 4.8 }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.46, 0]}>
        <cylinderGeometry args={[0.92, 1.12, height, 8]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, height + 0.12, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.5, 8]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.96} />
      </mesh>
      <mesh position={[0, height + 0.85, 0]}>
        <coneGeometry args={[1.04, 1.5, 8]} />
        <meshStandardMaterial color="#0b1020" roughness={0.86} />
      </mesh>
    </group>
  );
}

function GateHouse({ x, color, active }) {
  const glow = active ? 1.7 : 0.56;
  return (
    <group position={[x, 0, -8.4]}>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[4.6, 5.2, 1.4]} />
        <meshStandardMaterial color={STONE} roughness={0.94} />
      </mesh>
      <mesh position={[0, 1.55, 0.76]}>
        <boxGeometry args={[2.15, 3.1, 0.18]} />
        <meshStandardMaterial color="#03050d" roughness={1} />
      </mesh>
      <mesh position={[0, 3.12, 0.82]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.52, 1.52, 0.16]} />
        <meshStandardMaterial color="#03050d" roughness={1} />
      </mesh>
      <pointLight position={[0, 1.6, 1.2]} color={color} intensity={glow * 3.1} distance={9} decay={2} />
      <mesh position={[0, 0.035, 1.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.12 : 0.03} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <Tower position={[-2.75, 0, -0.2]} height={4.5} />
      <Tower position={[2.75, 0, -0.2]} height={4.5} />
      <Banner position={[-2.75, 4.9, 0.55]} color={color} />
      <Banner position={[2.75, 4.9, 0.55]} color={color} flip />
      <Torch position={[-1.55, 0.08, 1.1]} color={color} intensity={active ? 4.2 : 2.1} />
      <Torch position={[1.55, 0.08, 1.1]} color={color} intensity={active ? 4.2 : 2.1} />
    </group>
  );
}

function RoadTrail({ side, color, active, selected }) {
  const direction = side === 'left' ? -1 : 1;
  const tiles = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const t = index / 9;
    return {
      x: direction * (0.15 + t * t * 3.65),
      z: 4.8 - t * 11.2,
      rotation: direction * t * 0.24,
      width: 1.35 + t * 0.7,
    };
  }), [direction]);

  const opacity = selected ? 0.26 : active ? 0.16 : 0.035;
  const emissiveIntensity = selected ? 1.15 : active ? 0.58 : 0.08;

  return (
    <group>
      {tiles.map((tile, index) => (
        <group key={index} position={[tile.x, 0.025, tile.z]} rotation={[0, tile.rotation, 0]}>
          <mesh>
            <boxGeometry args={[tile.width, 0.055, 0.82]} />
            <meshStandardMaterial color="#171e36" roughness={0.98} emissive={color} emissiveIntensity={emissiveIntensity} />
          </mesh>
          <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[tile.width * 0.86, 0.34]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ForkMonument() {
  const ring = useRef(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.y = clock.getElapsedTime() * 0.14;
  });

  return (
    <group position={[0, 0, 2.9]}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.62, 0.82, 0.84, 8]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.95} />
      </mesh>
      <mesh ref={ring} position={[0, 1.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.055, 8, 40]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.5} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.34} roughness={0.28} metalness={0.32} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color={GOLD} intensity={1.6} distance={5} decay={2} />
    </group>
  );
}

export default function KingdomGate({ hoveredRoad, selectedRoad }) {
  const leftActive = hoveredRoad === 'left' || selectedRoad === 'left';
  const rightActive = hoveredRoad === 'right' || selectedRoad === 'right';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -2]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>

      <RoadTrail side="left" color={GOLD} active={leftActive} selected={selectedRoad === 'left'} />
      <RoadTrail side="right" color={BLUE} active={rightActive} selected={selectedRoad === 'right'} />

      <GateHouse x={-4.15} color={GOLD} active={leftActive} />
      <GateHouse x={4.15} color={BLUE} active={rightActive} />
      <ForkMonument />

      <mesh position={[0, 2.2, -11.3]}>
        <boxGeometry args={[22, 4.4, 1.15]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} />
      </mesh>
      <Tower position={[-10.2, 0, -11.4]} height={5.6} />
      <Tower position={[10.2, 0, -11.4]} height={5.6} />

      {[
        [-15, -23, 5.8], [-8, -27, 7.2], [0, -30, 8.2], [9, -27, 6.4], [16, -22, 5.3],
      ].map(([x, z, size], index) => (
        <mesh key={index} position={[x, size / 2 - 0.7, z]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[size * 1.08, size, 4]} />
          <meshStandardMaterial color="#070a15" roughness={1} />
        </mesh>
      ))}

      <Torch position={[-1.8, 0.04, 4.1]} color={GOLD} intensity={2.6} />
      <Torch position={[1.8, 0.04, 4.1]} color={BLUE} intensity={2.2} />
      <Torch position={[-2.7, 0.04, 0.8]} color={GOLD} intensity={2.8} />
      <Torch position={[2.7, 0.04, 0.8]} color={BLUE} intensity={2.4} />

      <Sparkles count={86} scale={[20, 7, 18]} position={[0, 2.8, -2]} size={2.1} speed={0.24} color={EMBER} opacity={0.48} />
      <Sparkles count={42} scale={[18, 5, 15]} position={[0, 1.9, -4]} size={1.1} speed={0.14} color={GOLD_BRIGHT} opacity={0.30} />
    </group>
  );
}
