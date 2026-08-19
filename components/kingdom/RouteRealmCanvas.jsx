'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';
import {
  ACESFilmicToneMapping,
  DoubleSide,
  MathUtils,
  PCFSoftShadowMap,
  SRGBColorSpace,
} from 'three';

const STONE = '#465982';
const STONE_LIGHT = '#6075a0';
const STONE_DARK = '#1d2b4e';
const METAL = '#20263a';
const GROUND = '#0b1530';
const WOOD = '#4d342c';

function useMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);
  return mobile;
}

function CameraRig({ realm, reducedMotion }) {
  const { camera, pointer } = useThree();
  const target = useRef({ x: 0, y: 1.7, z: -2.4 });

  const framing = useMemo(() => {
    if (realm === 'war-room') return { y: 4.2, z: 11.6, lookY: 1.45, lookZ: -2.2, fov: 39 };
    if (realm === 'ministers-hall') return { y: 4.0, z: 11.9, lookY: 1.45, lookZ: -2.4, fov: 40 };
    if (realm === 'dragon-forge') return { y: 3.4, z: 11.4, lookY: 1.7, lookZ: -2.6, fov: 40 };
    return { y: 3.45, z: 11.7, lookY: 1.7, lookZ: -2.6, fov: 40 };
  }, [realm]);

  useFrame(({ clock }, delta) => {
    const drift = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 0.22) * 0.055;
    const px = reducedMotion ? 0 : pointer.x;
    const py = reducedMotion ? 0 : pointer.y;
    const smoothing = 1 - Math.exp(-delta * 2.8);
    const goalX = px * 0.62 + drift;
    const goalY = framing.y + py * 0.2;
    const goalZ = framing.z - Math.abs(px) * 0.12;

    camera.position.x = MathUtils.lerp(camera.position.x, goalX, smoothing);
    camera.position.y = MathUtils.lerp(camera.position.y, goalY, smoothing);
    camera.position.z = MathUtils.lerp(camera.position.z, goalZ, smoothing);
    camera.fov = MathUtils.lerp(camera.fov, framing.fov, smoothing);
    camera.updateProjectionMatrix();

    target.current.x = MathUtils.lerp(target.current.x, px * 0.85, smoothing);
    target.current.y = MathUtils.lerp(target.current.y, framing.lookY + py * 0.08, smoothing);
    target.current.z = MathUtils.lerp(target.current.z, framing.lookZ, smoothing);
    camera.lookAt(target.current.x, target.current.y, target.current.z);
  });

  return null;
}

function WorldDrift({ children, reducedMotion }) {
  const group = useRef(null);
  const { pointer } = useThree();

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const px = reducedMotion ? 0 : pointer.x;
    const py = reducedMotion ? 0 : pointer.y;
    const idle = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 0.19) * 0.008;
    const smoothing = 1 - Math.exp(-delta * 2.4);
    group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, px * -0.035 + idle, smoothing);
    group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, py * 0.012, smoothing);
  });

  return <group ref={group}>{children}</group>;
}

function Torch({ position, color, intensity = 2.4, scale = 1 }) {
  const flame = useRef(null);
  const light = useRef(null);
  const seed = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed.current;
    const flicker = Math.sin(t * 8.1) * 0.12 + Math.sin(t * 4.4) * 0.08;
    if (flame.current) flame.current.scale.y = 1 + flicker;
    if (light.current) light.current.intensity = intensity + flicker * 1.6;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.08, 0.84, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={flame} position={[0, 0.93, 0]}>
        <coneGeometry args={[0.1, 0.34, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 1.0, 0]} color={color} intensity={intensity} distance={8} decay={2} />
    </group>
  );
}

function Banner({ position, color, rotation = [0, 0, 0], scale = 1 }) {
  const cloth = useRef(null);
  const phase = useRef(position[0] * 0.7 + position[2]);
  useFrame(({ clock }) => {
    if (!cloth.current) return;
    cloth.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.1 + phase.current) * 0.055;
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 2.7, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.65} roughness={0.36} />
      </mesh>
      <mesh position={[0, 1.86, 0]}>
        <boxGeometry args={[0.74, 0.045, 0.045]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.42} />
      </mesh>
      <mesh ref={cloth} position={[0.28, 1.08, 0]} castShadow>
        <planeGeometry args={[0.62, 1.45, 1, 4]} />
        <meshStandardMaterial color={color} side={DoubleSide} roughness={0.82} />
      </mesh>
    </group>
  );
}

function Battlements({ width = 5, y = 3.2, z = 0, color = STONE_DARK }) {
  const count = Math.max(4, Math.floor(width / 0.68));
  return Array.from({ length: count }, (_, index) => {
    const x = -width / 2 + 0.35 + index * ((width - 0.7) / Math.max(count - 1, 1));
    return (
      <mesh key={index} position={[x, y, z]} castShadow>
        <boxGeometry args={[0.38, 0.5, 0.72]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    );
  });
}

function Tower({ position, height = 4.3, accent }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.94, height, 10]} />
        <meshStandardMaterial color={STONE} roughness={0.94} />
      </mesh>
      <mesh position={[0, height + 0.16, 0]} castShadow>
        <cylinderGeometry args={[1.02, 1.02, 0.42, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>
      <mesh position={[0, height + 0.94, 0]} castShadow>
        <coneGeometry args={[0.88, 1.55, 10]} />
        <meshStandardMaterial color="#111b37" roughness={0.82} />
      </mesh>
      <mesh position={[0, height + 1.77, 0]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function StoneArch({ position = [0, 0, 0], width = 4.7, height = 4.5, accent, portalOpacity = 0.12 }) {
  return (
    <group position={position}>
      <mesh position={[-width * 0.36, height * 0.43, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.28, height * 0.86, 1.25]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[width * 0.36, height * 0.43, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.28, height * 0.86, 1.25]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, height * 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.27, 1.25]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.94} />
      </mesh>
      <Battlements width={width} y={height + 0.52} z={0} />
      <mesh position={[0, height * 0.38, 0.67]}>
        <planeGeometry args={[width * 0.43, height * 0.68]} />
        <meshBasicMaterial color="#02050d" />
      </mesh>
      <mesh position={[0, height * 0.71, 0.72]}>
        <torusGeometry args={[width * 0.215, 0.17, 10, 34, Math.PI]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
      </mesh>
      <mesh position={[0, height * 0.38, 0.74]}>
        <planeGeometry args={[width * 0.39, height * 0.62]} />
        <meshBasicMaterial color={accent} transparent opacity={portalOpacity} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, height * 0.42, 1.0]} color={accent} intensity={2.8} distance={9} decay={2} />
    </group>
  );
}

function MountainRange() {
  return (
    <group position={[0, -0.2, -12]}>
      {[-9, -5, -1.5, 2.2, 6.2, 10].map((x, index) => (
        <mesh key={x} position={[x, 1.4 + (index % 2) * 0.4, index % 3]} rotation={[0, 0.35 * (index % 2), 0]}>
          <coneGeometry args={[3.5 + (index % 2), 6 + (index % 3), 5]} />
          <meshStandardMaterial color={index % 2 ? '#162340' : '#1c2b4a'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function GroundPlane({ accent }) {
  return (
    <>
      <mesh position={[0, -0.08, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 27, 1, 1]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>
      <mesh position={[0, -0.055, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.8, 48]} />
        <meshBasicMaterial color={accent} transparent opacity={0.028} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

function OuterGateRealm({ accent, secondary }) {
  return (
    <group>
      <StoneArch position={[0, 0, -3.6]} width={5.4} height={4.9} accent={accent} portalOpacity={0.16} />
      <Tower position={[-4.2, 0, -4.1]} height={4.7} accent={accent} />
      <Tower position={[4.2, 0, -4.1]} height={4.7} accent={secondary} />
      <Banner position={[-3.9, 0, -2.4]} color={accent} />
      <Banner position={[3.9, 0, -2.4]} color={secondary} rotation={[0, Math.PI, 0]} />
      {Array.from({ length: 9 }, (_, index) => {
        const z = 5.2 - index * 0.92;
        const width = 2.0 + index * 0.18;
        return (
          <mesh key={index} position={[0, 0.02, z]} receiveShadow>
            <boxGeometry args={[width, 0.08, 0.68]} />
            <meshStandardMaterial color={index % 2 ? '#243453' : '#2a3c60'} roughness={0.98} />
          </mesh>
        );
      })}
      <group position={[-3.3, 0, 2.7]}>
        <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.85, 0.7, 0.72]} /><meshStandardMaterial color={WOOD} roughness={0.92} /></mesh>
        <mesh position={[0.68, 0.27, -0.25]} castShadow><boxGeometry args={[0.58, 0.54, 0.54]} /><meshStandardMaterial color="#5b4135" roughness={0.92} /></mesh>
      </group>
      <Torch position={[-1.85, 0, -2.0]} color={accent} />
      <Torch position={[1.85, 0, -2.0]} color={secondary} />
    </group>
  );
}

function InnerKeepRealm({ accent, secondary }) {
  return (
    <group>
      <StoneArch position={[0, 0, -4.3]} width={6.0} height={5.2} accent={accent} portalOpacity={0.11} />
      <Tower position={[-5.0, 0, -4.7]} height={5.0} accent={secondary} />
      <Tower position={[5.0, 0, -4.7]} height={5.0} accent={accent} />
      <mesh position={[0, 0.42, 1.0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.12, 1.35, 0.84, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
      </mesh>
      <Float speed={1.1} rotationIntensity={0.22} floatIntensity={0.28}>
        <mesh position={[0, 1.55, 1.0]}>
          <octahedronGeometry args={[0.58, 0]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.78} metalness={0.42} roughness={0.28} />
        </mesh>
      </Float>
      <pointLight position={[0, 1.55, 1.0]} color={accent} intensity={3.8} distance={9} decay={2} />
      <Banner position={[-3.4, 0, -2.9]} color={accent} />
      <Banner position={[3.4, 0, -2.9]} color={secondary} rotation={[0, Math.PI, 0]} />
      <Torch position={[-2.1, 0, -1.65]} color={secondary} />
      <Torch position={[2.1, 0, -1.65]} color={accent} />
    </group>
  );
}

function TrainingYardRealm({ accent, secondary }) {
  return (
    <group>
      <mesh position={[0, 0.03, -0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[3.15, 0.16, 10, 56]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.02, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.0, 48]} />
        <meshStandardMaterial color="#172644" roughness={1} />
      </mesh>
      <StoneArch position={[0, 0, -5.4]} width={4.9} height={4.3} accent={secondary} portalOpacity={0.06} />
      <Banner position={[-4.0, 0, -0.1]} color={accent} />
      <Banner position={[4.0, 0, -0.1]} color={secondary} rotation={[0, Math.PI, 0]} />
      <Banner position={[0, 0, -3.4]} color="#d9a94e" />
      {[-2.15, 2.15].map((x) => (
        <group key={x} position={[x, 0, 1.4]}>
          <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.15, 0.12, 0.32]} /><meshStandardMaterial color={WOOD} roughness={0.9} /></mesh>
          <mesh position={[-0.42, 0.26, 0]} castShadow><boxGeometry args={[0.1, 0.52, 0.12]} /><meshStandardMaterial color={WOOD} /></mesh>
          <mesh position={[0.42, 0.26, 0]} castShadow><boxGeometry args={[0.1, 0.52, 0.12]} /><meshStandardMaterial color={WOOD} /></mesh>
          <mesh position={[-0.2, 1.04, 0]} rotation={[0, 0, 0.62]} castShadow><boxGeometry args={[0.08, 1.25, 0.08]} /><meshStandardMaterial color={METAL} metalness={0.7} roughness={0.34} /></mesh>
          <mesh position={[0.2, 1.04, 0]} rotation={[0, 0, -0.62]} castShadow><boxGeometry args={[0.08, 1.25, 0.08]} /><meshStandardMaterial color={METAL} metalness={0.7} roughness={0.34} /></mesh>
        </group>
      ))}
      <Torch position={[-3.0, 0, -2.7]} color={accent} />
      <Torch position={[3.0, 0, -2.7]} color={secondary} />
    </group>
  );
}

function Armillary({ accent, secondary }) {
  const root = useRef(null);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.rotation.y = clock.getElapsedTime() * 0.18;
  });
  return (
    <group ref={root} position={[0, 2.0, -0.1]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.08, 0.055, 8, 48]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} metalness={0.72} roughness={0.28} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[1.08, 0.055, 8, 48]} /><meshStandardMaterial color={secondary} emissive={secondary} emissiveIntensity={0.35} metalness={0.72} roughness={0.28} /></mesh>
      <mesh rotation={[0.8, 0.42, 0]}><torusGeometry args={[1.08, 0.055, 8, 48]} /><meshStandardMaterial color="#f4cf7a" metalness={0.72} roughness={0.28} /></mesh>
      <mesh><icosahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} roughness={0.25} /></mesh>
    </group>
  );
}

function ArmoryRealm({ accent, secondary }) {
  const relics = [-3.7, -2.25, 2.25, 3.7];
  return (
    <group>
      <StoneArch position={[0, 0, -5.3]} width={6.5} height={4.8} accent={accent} portalOpacity={0.045} />
      <mesh position={[0, 0.48, -0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.65, 0.96, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.88} />
      </mesh>
      <Armillary accent={accent} secondary={secondary} />
      {relics.map((x, index) => (
        <group key={x} position={[x, 0, -0.15]}>
          <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.46, 0.58, 0.84, 8]} /><meshStandardMaterial color={STONE_DARK} roughness={0.92} /></mesh>
          <Float speed={0.75 + index * 0.08} rotationIntensity={0.28} floatIntensity={0.18}>
            <mesh position={[0, 1.18, 0]}><octahedronGeometry args={[0.32 + (index % 2) * 0.06, 0]} /><meshStandardMaterial color={index % 2 ? secondary : accent} emissive={index % 2 ? secondary : accent} emissiveIntensity={0.52} metalness={0.55} roughness={0.28} /></mesh>
          </Float>
        </group>
      ))}
      <Torch position={[-2.0, 0, -3.0]} color={accent} />
      <Torch position={[2.0, 0, -3.0]} color={secondary} />
    </group>
  );
}

function Hourglass({ accent }) {
  const sand = useRef(null);
  useFrame(({ clock }) => {
    if (!sand.current) return;
    sand.current.rotation.y = clock.getElapsedTime() * 0.22;
  });
  return (
    <group position={[0, 1.05, -0.65]} scale={0.9}>
      <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.48, 0.48, 0.1, 16]} /><meshStandardMaterial color={METAL} metalness={0.62} roughness={0.35} /></mesh>
      <mesh position={[0, -0.72, 0]}><cylinderGeometry args={[0.48, 0.48, 0.1, 16]} /><meshStandardMaterial color={METAL} metalness={0.62} roughness={0.35} /></mesh>
      <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.38, 0.72, 20]} /><meshPhysicalMaterial color="#c9d7f2" transparent opacity={0.25} roughness={0.1} transmission={0.2} /></mesh>
      <mesh position={[0, -0.34, 0]}><coneGeometry args={[0.38, 0.72, 20]} /><meshPhysicalMaterial color="#c9d7f2" transparent opacity={0.25} roughness={0.1} transmission={0.2} /></mesh>
      <mesh ref={sand} position={[0, -0.35, 0]}><coneGeometry args={[0.24, 0.4, 16]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} roughness={0.8} /></mesh>
    </group>
  );
}

function MinistersHallRealm({ accent, secondary }) {
  return (
    <group>
      <StoneArch position={[0, 0, -5.5]} width={7.0} height={5.0} accent={accent} portalOpacity={0.035} />
      {[-4.7, -3.0, 3.0, 4.7].map((x) => (
        <mesh key={x} position={[x, 2.1, -3.7]} castShadow>
          <cylinderGeometry args={[0.3, 0.38, 4.2, 12]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.94} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, -0.55]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.38, 28]} />
        <meshStandardMaterial color={WOOD} roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.23, -0.55]} castShadow><cylinderGeometry args={[1.0, 1.35, 0.52, 16]} /><meshStandardMaterial color={METAL} metalness={0.3} roughness={0.62} /></mesh>
      <Hourglass accent={accent} />
      {[-2.1, 2.1].map((x) => (
        <group key={x} position={[x, 0, 1.45]}>
          <mesh position={[0, 0.38, 0]} castShadow><boxGeometry args={[0.85, 0.18, 0.78]} /><meshStandardMaterial color="#2c3350" roughness={0.84} /></mesh>
          <mesh position={[0, 1.0, 0.34]} rotation={[-0.14, 0, 0]} castShadow><boxGeometry args={[0.85, 1.05, 0.16]} /><meshStandardMaterial color="#2c3350" roughness={0.84} /></mesh>
        </group>
      ))}
      <Banner position={[-3.4, 0, -3.0]} color={accent} />
      <Banner position={[3.4, 0, -3.0]} color={secondary} rotation={[0, Math.PI, 0]} />
      <Torch position={[-2.9, 0, -1.4]} color={secondary} />
      <Torch position={[2.9, 0, -1.4]} color={accent} />
    </group>
  );
}

function Anvil({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.72, 0.22, 0.68]} /><meshStandardMaterial color={METAL} metalness={0.78} roughness={0.32} /></mesh>
      <mesh position={[0.22, 0.66, 0]} castShadow><boxGeometry args={[1.15, 0.26, 0.52]} /><meshStandardMaterial color="#30384b" metalness={0.82} roughness={0.28} /></mesh>
      <mesh position={[-0.46, 0.66, 0]} rotation={[0, 0, Math.PI / 4]} castShadow><boxGeometry args={[0.52, 0.26, 0.52]} /><meshStandardMaterial color="#30384b" metalness={0.82} roughness={0.28} /></mesh>
    </group>
  );
}

function DragonForgeRealm({ accent, secondary }) {
  return (
    <group>
      <StoneArch position={[0, 0, -5.25]} width={6.5} height={5.0} accent={accent} portalOpacity={0.24} />
      {[[-3.8, 0.4], [3.8, -0.4]].map(([x, r], index) => (
        <group key={x} position={[x, 1.7, -3.7]} rotation={[0, 0, r]}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[2.15, 0.2, 10, 38, Math.PI * 0.72]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.84} />
          </mesh>
          <mesh position={[index ? -1.5 : 1.5, 1.3, 0]} rotation={[0, 0, index ? 0.4 : -0.4]} castShadow>
            <coneGeometry args={[0.36, 2.5, 10]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <Anvil position={[0, 0, 0.7]} />
      <mesh position={[0, 0.05, -2.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 36]} />
        <meshBasicMaterial color={accent} transparent opacity={0.14} toneMapped={false} />
      </mesh>
      <Torch position={[-2.35, 0, -2.0]} color={accent} intensity={3.0} scale={1.15} />
      <Torch position={[2.35, 0, -2.0]} color={secondary} intensity={2.6} scale={1.15} />
      <Sparkles count={50} position={[0, 1.8, -1.8]} scale={[6, 4, 5]} size={1.4} speed={0.4} color={accent} opacity={0.72} />
    </group>
  );
}

function StrategicRings({ accent, secondary }) {
  const group = useRef(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = t * 0.16;
    group.current.position.y = 1.7 + Math.sin(t * 0.8) * 0.05;
  });
  return (
    <group ref={group} position={[0, 1.7, -0.9]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.25, 0.035, 8, 48]} /><meshBasicMaterial color={accent} transparent opacity={0.7} toneMapped={false} /></mesh>
      <mesh rotation={[0.9, 0.2, 0.4]}><torusGeometry args={[0.88, 0.03, 8, 42]} /><meshBasicMaterial color={secondary} transparent opacity={0.55} toneMapped={false} /></mesh>
      <mesh><icosahedronGeometry args={[0.22, 1]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.65} roughness={0.25} /></mesh>
    </group>
  );
}

function WarRoomRealm({ accent, secondary }) {
  const markers = [
    [-2.4, -0.2, accent], [-1.3, -1.15, secondary], [0.25, -0.45, accent], [1.6, -1.35, secondary], [2.5, 0.15, accent],
  ];
  return (
    <group>
      <StoneArch position={[0, 0, -5.4]} width={7.2} height={4.8} accent={secondary} portalOpacity={0.025} />
      <mesh position={[0, 0.72, -0.55]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.38, 3.45]} />
        <meshStandardMaterial color={WOOD} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.93, -0.55]}>
        <boxGeometry args={[5.8, 0.05, 2.92]} />
        <meshStandardMaterial color="#24395d" roughness={0.86} />
      </mesh>
      {markers.map(([x, z, color], index) => (
        <group key={index} position={[x, 0.97, z - 0.55]}>
          <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.11, 0.16, 0.36, 8]} /><meshStandardMaterial color={STONE_LIGHT} roughness={0.8} /></mesh>
          <mesh position={[0, 0.42, 0]}><octahedronGeometry args={[0.09, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.75} /></mesh>
        </group>
      ))}
      <StrategicRings accent={accent} secondary={secondary} />
      <Banner position={[-4.0, 0, -3.0]} color={accent} />
      <Banner position={[4.0, 0, -3.0]} color={secondary} rotation={[0, Math.PI, 0]} />
      <Torch position={[-3.2, 0, -1.5]} color={accent} />
      <Torch position={[3.2, 0, -1.5]} color={secondary} />
    </group>
  );
}

function FrontierRealm({ accent, secondary }) {
  return (
    <group>
      <Tower position={[0, 0, -4.2]} height={5.1} accent={accent} />
      <Banner position={[-2.5, 0, -1.9]} color={accent} />
      <Banner position={[2.5, 0, -1.9]} color={secondary} rotation={[0, Math.PI, 0]} />
      <Torch position={[-1.5, 0, -1.1]} color={accent} />
      <Torch position={[1.5, 0, -1.1]} color={secondary} />
      {[-4.2, -3.4, 3.3, 4.1].map((x, index) => (
        <mesh key={x} position={[x, 0.28, 0.2 + (index % 2)]} rotation={[0.2, index, 0.1]} castShadow>
          <dodecahedronGeometry args={[0.62 + (index % 2) * 0.2, 0]} />
          <meshStandardMaterial color="#263653" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function RealmEnvironment({ realm, accent, secondary }) {
  if (realm === 'outer-gate') return <OuterGateRealm accent={accent} secondary={secondary} />;
  if (realm === 'inner-keep') return <InnerKeepRealm accent={accent} secondary={secondary} />;
  if (realm === 'training-yard') return <TrainingYardRealm accent={accent} secondary={secondary} />;
  if (realm === 'armory') return <ArmoryRealm accent={accent} secondary={secondary} />;
  if (realm === 'ministers-hall') return <MinistersHallRealm accent={accent} secondary={secondary} />;
  if (realm === 'dragon-forge') return <DragonForgeRealm accent={accent} secondary={secondary} />;
  if (realm === 'war-room') return <WarRoomRealm accent={accent} secondary={secondary} />;
  return <FrontierRealm accent={accent} secondary={secondary} />;
}

function Scene({ realm, accent, secondary, reducedMotion, mobile }) {
  const emberScene = realm === 'dragon-forge';
  const coolScene = realm === 'inner-keep' || realm === 'war-room';
  const background = emberScene ? '#1a1422' : coolScene ? '#101d3b' : '#132142';
  const fogColor = emberScene ? '#1d1724' : '#132142';

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[fogColor, 11, 29]} />
      <ambientLight intensity={0.52} color="#7890bc" />
      <hemisphereLight args={['#a5bce5', '#0b1430', 0.78]} />
      <directionalLight
        position={[-8, 10, 7]}
        intensity={1.45}
        color="#c1d0ee"
        castShadow={!mobile}
        shadow-mapSize-width={mobile ? 512 : 1024}
        shadow-mapSize-height={mobile ? 512 : 1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={32}
      />
      <pointLight position={[-5, 4, 1]} color={accent} intensity={2.3} distance={16} decay={2} />
      <pointLight position={[5, 3.5, 0]} color={secondary} intensity={1.9} distance={15} decay={2} />

      {!mobile && <Stars radius={38} depth={22} count={260} factor={1.6} saturation={0.08} fade speed={0.1} />}
      <MountainRange />
      <GroundPlane accent={accent} />
      <WorldDrift reducedMotion={reducedMotion}>
        <RealmEnvironment realm={realm} accent={accent} secondary={secondary} />
      </WorldDrift>
      {!reducedMotion && realm !== 'dragon-forge' && (
        <Sparkles count={mobile ? 18 : 30} position={[0, 2.4, -2]} scale={[12, 4, 9]} size={0.75} speed={0.12} color={accent} opacity={0.26} />
      )}
      <CameraRig realm={realm} reducedMotion={reducedMotion} />
    </>
  );
}

export default function RouteRealmCanvas({ realm, accent, secondary, active, reducedMotion }) {
  const mobile = useMobile();
  const dpr = mobile ? 1 : 1.35;

  return (
    <Canvas
      dpr={dpr}
      shadows={!mobile}
      frameloop={active && !reducedMotion ? 'always' : 'demand'}
      camera={{ fov: 40, near: 0.1, far: 80, position: [0, 3.5, 11.7] }}
      gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: false }}
      performance={{ min: 0.55 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = mobile ? 1.22 : 1.28;
        gl.outputColorSpace = SRGBColorSpace;
        if (!mobile) gl.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      <Scene
        realm={realm}
        accent={accent}
        secondary={secondary}
        reducedMotion={reducedMotion}
        mobile={mobile}
      />
    </Canvas>
  );
}
