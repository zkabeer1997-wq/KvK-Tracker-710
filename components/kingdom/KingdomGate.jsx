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
const STONE_MID = '#283255';
const STONE_DARK = '#171e38';
const GROUND = '#070a16';

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
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.64)');
    gradient.addColorStop(0.54, 'rgba(255,255,255,0.16)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);
}

function Torch({ position, color = EMBER, intensity = 3.2, scale = 1 }) {
  const light = useRef(null);
  const halo = useRef(null);
  const flame = useRef(null);
  const seed = useRef(Math.random() * 8);
  const glowTexture = useGlowTexture();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed.current;
    const flicker = Math.sin(t * 8.7) * 0.28 + Math.sin(t * 3.6) * 0.16;
    if (light.current) light.current.intensity = intensity + flicker;
    if (halo.current) halo.current.scale.setScalar((1.35 + flicker * 0.14) * scale);
    if (flame.current) flame.current.scale.y = 1 + flicker * 0.12;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.075, 1, 7]} />
        <meshStandardMaterial color="#141722" metalness={0.3} roughness={0.72} />
      </mesh>
      <mesh ref={flame} position={[0, 1.1, 0]}>
        <coneGeometry args={[0.085, 0.25, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.96} toneMapped={false} />
      </mesh>
      {glowTexture && (
        <sprite ref={halo} position={[0, 1.1, 0]} scale={[1.35, 1.35, 1.35]}>
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
      <pointLight ref={light} position={[0, 1.05, 0]} color={color} intensity={intensity} distance={8.5} decay={2} />
    </group>
  );
}

function Brazier({ position, color = GOLD, active = false }) {
  const glow = useRef(null);
  useFrame(({ clock }) => {
    if (!glow.current) return;
    glow.current.intensity = (active ? 3.5 : 2.1) + Math.sin(clock.getElapsedTime() * 7.8 + position[0]) * 0.24;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.22, 0.42, 8]} />
        <meshStandardMaterial color="#25283a" metalness={0.46} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.73, 0]}>
        <coneGeometry args={[0.16, 0.42, 9]} />
        <meshBasicMaterial color={color} transparent opacity={0.94} toneMapped={false} />
      </mesh>
      <pointLight ref={glow} position={[0, 0.78, 0]} color={color} intensity={2.2} distance={7} decay={2} />
    </group>
  );
}

function Banner({ position, color, flip = false, scale = 1 }) {
  const group = useRef(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.25 + position[0]) * 0.10 + (flip ? Math.PI : 0);
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh position={[0, -0.88, 0]} castShadow>
        <planeGeometry args={[0.62, 1.78, 1, 6]} />
        <meshStandardMaterial color={color} side={DoubleSide} roughness={0.74} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.8, 0.06, 0.06]} />
        <meshStandardMaterial color="#111522" metalness={0.5} roughness={0.45} />
      </mesh>
    </group>
  );
}

function Crenellations({ width, y, z = 0, color = STONE_DARK, depth = 1.5 }) {
  const count = Math.max(3, Math.round(width / 0.72));
  return Array.from({ length: count }, (_, index) => {
    const x = -width / 2 + 0.38 + index * ((width - 0.76) / Math.max(count - 1, 1));
    return (
      <mesh key={index} position={[x, y, z]} castShadow>
        <boxGeometry args={[0.38, 0.52, depth]} />
        <meshStandardMaterial color={color} roughness={0.96} />
      </mesh>
    );
  });
}

function Tower({ position, height = 5.2, roofColor = '#0b1020' }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.46, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.94, 1.18, height, 10]} />
        <meshStandardMaterial color={STONE} roughness={0.96} />
      </mesh>
      <mesh position={[0, height + 0.12, 0]} castShadow>
        <cylinderGeometry args={[1.25, 1.25, 0.5, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.96} />
      </mesh>
      <mesh position={[0, height + 0.9, 0]} castShadow>
        <coneGeometry args={[1.08, 1.55, 10]} />
        <meshStandardMaterial color={roofColor} roughness={0.82} metalness={0.08} />
      </mesh>
      <mesh position={[0, height + 1.72, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.22} metalness={0.5} roughness={0.34} />
      </mesh>
      <mesh position={[0, height * 0.66, 0.88]}>
        <boxGeometry args={[0.38, 0.65, 0.12]} />
        <meshBasicMaterial color="#050711" />
      </mesh>
    </group>
  );
}

function GateHouse({ x, color, active }) {
  const portalOpacity = active ? 0.24 : 0.075;
  const emissiveIntensity = active ? 0.95 : 0.24;

  return (
    <group position={[x, 0, -9.0]}>
      <mesh position={[-1.75, 2.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 4.85, 1.65]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[1.75, 2.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 4.85, 1.65]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.75, 1.15, 1.65]} />
        <meshStandardMaterial color={STONE_MID} roughness={0.95} />
      </mesh>
      <Crenellations width={4.9} y={5.08} z={0} depth={1.62} />

      <mesh position={[0, 1.12, 0.84]}>
        <planeGeometry args={[2.35, 2.24]} />
        <meshBasicMaterial color="#02040a" />
      </mesh>
      <mesh position={[0, 2.24, 0.84]}>
        <circleGeometry args={[1.175, 32, 0, Math.PI]} />
        <meshBasicMaterial color="#02040a" />
      </mesh>
      <mesh position={[0, 2.24, 0.94]}>
        <torusGeometry args={[1.18, 0.18, 8, 28, Math.PI]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.88} metalness={0.05} />
      </mesh>
      <mesh position={[-1.18, 1.14, 0.94]} castShadow>
        <boxGeometry args={[0.28, 2.28, 0.28]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>
      <mesh position={[1.18, 1.14, 0.94]} castShadow>
        <boxGeometry args={[0.28, 2.28, 0.28]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.7, 1.02]}>
        <planeGeometry args={[2.05, 3.15]} />
        <meshBasicMaterial color={color} transparent opacity={portalOpacity} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 1.7, 1.15]} color={color} intensity={active ? 5.8 : 2.0} distance={11} decay={2} />

      <mesh position={[0, 3.78, 0.96]}>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} metalness={0.45} roughness={0.3} />
      </mesh>

      <Tower position={[-3.0, 0, -0.18]} height={5.15} roofColor={active ? STONE_DARK : '#0a0e1c'} />
      <Tower position={[3.0, 0, -0.18]} height={5.15} roofColor={active ? STONE_DARK : '#0a0e1c'} />
      <Banner position={[-2.98, 5.4, 0.92]} color={color} scale={1.08} />
      <Banner position={[2.98, 5.4, 0.92]} color={color} flip scale={1.08} />

      <Torch position={[-1.52, 0.08, 1.28]} color={color} intensity={active ? 4.6 : 2.4} />
      <Torch position={[1.52, 0.08, 1.28]} color={color} intensity={active ? 4.6 : 2.4} />
    </group>
  );
}

function RoadTrail({ side, color, active, selected }) {
  const direction = side === 'left' ? -1 : 1;
  const tiles = useMemo(() => Array.from({ length: 11 }, (_, index) => {
    const t = index / 10;
    return {
      x: direction * (0.12 + t * t * 4.0),
      z: 4.8 - t * 12.0,
      rotation: direction * t * 0.28,
      width: 1.28 + t * 0.74,
    };
  }), [direction]);

  const opacity = selected ? 0.3 : active ? 0.17 : 0.028;
  const emissiveIntensity = selected ? 1.2 : active ? 0.6 : 0.045;

  return (
    <group>
      {tiles.map((tile, index) => (
        <group key={index} position={[tile.x, 0.02, tile.z]} rotation={[0, tile.rotation, 0]}>
          <mesh receiveShadow castShadow={index > 4}>
            <boxGeometry args={[tile.width, 0.07, 0.82]} />
            <meshStandardMaterial color={index % 2 ? '#151c34' : '#1a2240'} roughness={0.98} emissive={color} emissiveIntensity={emissiveIntensity} />
          </mesh>
          <mesh position={[0, 0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[tile.width * 0.82, 0.32]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
          {index > 1 && index % 2 === 0 && (
            <>
              <mesh position={[-tile.width * 0.62, 0.08, 0]} rotation={[0.2, 0.4, 0.1]}>
                <dodecahedronGeometry args={[0.12, 0]} />
                <meshStandardMaterial color="#242d4b" roughness={1} />
              </mesh>
              <mesh position={[tile.width * 0.62, 0.08, 0]} rotation={[0.1, -0.25, 0.2]}>
                <dodecahedronGeometry args={[0.1, 0]} />
                <meshStandardMaterial color="#222a46" roughness={1} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function ForkMonument() {
  const ring = useRef(null);
  const core = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.y = t * 0.13;
    if (core.current) core.current.position.y = 1.64 + Math.sin(t * 1.2) * 0.045;
  });

  return (
    <group position={[0, 0, 2.82]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.68, 0.9, 0.9, 8]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.1, 8]} />
        <meshStandardMaterial color={STONE_MID} roughness={0.9} />
      </mesh>
      <mesh ref={ring} position={[0, 1.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.055, 8, 40]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.5} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh ref={core} position={[0, 1.66, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.36} roughness={0.28} metalness={0.32} />
      </mesh>
      <group position={[0, 1.16, 0]}>
        <mesh position={[-0.7, 0.18, 0]} rotation={[0, 0, -0.28]}>
          <boxGeometry args={[1.35, 0.13, 0.13]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.2} metalness={0.32} roughness={0.45} />
        </mesh>
        <mesh position={[0.7, 0.18, 0]} rotation={[0, 0, 0.28]}>
          <boxGeometry args={[1.35, 0.13, 0.13]} />
          <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.2} metalness={0.32} roughness={0.45} />
        </mesh>
      </group>
      <pointLight position={[0, 1.58, 0]} color={GOLD} intensity={1.8} distance={5.5} decay={2} />
    </group>
  );
}

function Pine({ position, scale = 1, rotation = 0 }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.9, 7]} />
        <meshStandardMaterial color="#151520" roughness={1} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <coneGeometry args={[0.82, 2.2, 8]} />
        <meshStandardMaterial color="#111d25" roughness={1} />
      </mesh>
      <mesh position={[0, 2.82, 0]} castShadow>
        <coneGeometry args={[0.62, 1.75, 8]} />
        <meshStandardMaterial color="#162630" roughness={1} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial color="#202844" roughness={1} />
    </mesh>
  );
}

function TerrainDetails() {
  const pines = [
    [-8.8, 0, 5.4, 1.15, 0.2], [-10.4, 0, 1.4, 1.45, 0.8], [-8.1, 0, -2.5, 0.92, -0.4],
    [8.7, 0, 5.6, 1.05, -0.6], [10.5, 0, 1.0, 1.42, 0.35], [8.3, 0, -2.7, 0.9, 0.75],
    [-12.4, 0, -7.0, 1.7, 0.1], [12.5, 0, -6.4, 1.6, -0.2],
  ];

  return (
    <group>
      {pines.map(([x, y, z, scale, rotation], index) => (
        <Pine key={index} position={[x, y, z]} scale={scale} rotation={rotation} />
      ))}
      <Rock position={[-6.7, 0.42, 5.8]} scale={[1.5, 0.72, 1.1]} rotation={[0.08, 0.5, -0.06]} />
      <Rock position={[6.3, 0.32, 6.4]} scale={[1.1, 0.55, 0.85]} rotation={[0.2, -0.35, 0.12]} />
      <Rock position={[-9.2, 0.35, -0.4]} scale={[1.25, 0.6, 0.9]} rotation={[0.1, 0.1, 0.18]} />
      <Rock position={[9.5, 0.45, -1.1]} scale={[1.5, 0.7, 1.1]} rotation={[0.18, -0.5, -0.12]} />
    </group>
  );
}

function WatchWall() {
  return (
    <group position={[0, 0, -11.7]}>
      <mesh position={[0, 2.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[23.5, 4.25, 1.2]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} />
      </mesh>
      <Crenellations width={23.2} y={4.55} z={0} color="#12182f" depth={1.18} />
      <Tower position={[-11.8, 0, -0.1]} height={6.2} />
      <Tower position={[11.8, 0, -0.1]} height={6.2} />
      <Banner position={[-11.8, 6.45, 0.9]} color={EMBER} scale={1.12} />
      <Banner position={[11.8, 6.45, 0.9]} color={GOLD} flip scale={1.12} />
    </group>
  );
}

export default function KingdomGate({ hoveredRoad, selectedRoad }) {
  const leftActive = hoveredRoad === 'left' || selectedRoad === 'left';
  const rightActive = hoveredRoad === 'right' || selectedRoad === 'right';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -2]} receiveShadow>
        <planeGeometry args={[76, 76]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>

      <RoadTrail side="left" color={GOLD} active={leftActive} selected={selectedRoad === 'left'} />
      <RoadTrail side="right" color={BLUE} active={rightActive} selected={selectedRoad === 'right'} />

      <WatchWall />
      <GateHouse x={-4.25} color={GOLD} active={leftActive} />
      <GateHouse x={4.25} color={BLUE} active={rightActive} />
      <ForkMonument />
      <TerrainDetails />

      <Brazier position={[-1.55, 0.02, 2.15]} color={GOLD} active={leftActive} />
      <Brazier position={[1.55, 0.02, 2.15]} color={BLUE} active={rightActive} />
      <Torch position={[-2.0, 0.04, 5.0]} color={GOLD} intensity={2.7} />
      <Torch position={[2.0, 0.04, 5.0]} color={BLUE} intensity={2.4} />
      <Torch position={[-3.15, 0.04, -0.1]} color={GOLD} intensity={2.9} />
      <Torch position={[3.15, 0.04, -0.1]} color={BLUE} intensity={2.6} />

      {[
        [-16, -24, 6.4], [-9, -28, 8.0], [0, -31, 9.0], [9, -28, 7.2], [17, -23, 6.0],
      ].map(([x, z, size], index) => (
        <mesh key={index} position={[x, size / 2 - 0.8, z]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[size * 1.08, size, 4]} />
          <meshStandardMaterial color={index === 2 ? '#080b17' : '#060914'} roughness={1} />
        </mesh>
      ))}

      <Sparkles count={64} scale={[20, 6, 18]} position={[0, 2.6, -1.5]} size={1.8} speed={0.23} color={EMBER} opacity={0.4} />
      <Sparkles count={26} scale={[12, 4, 12]} position={[0, 1.4, 1.5]} size={1.05} speed={0.13} color={GOLD_BRIGHT} opacity={0.28} />
    </group>
  );
}
