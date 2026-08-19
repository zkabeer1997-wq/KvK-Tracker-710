'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  MathUtils,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { AuthoredDistrictArchitecture, AuthoredModel } from './AuthoredCastleAssets';

const GROUND = '#0b1530';

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

function springVector(current, velocity, target, delta, stiffness = 42, damping = 13) {
  const dt = Math.min(delta, 1 / 30);
  velocity.addScaledVector(target.clone().sub(current), stiffness * dt);
  velocity.multiplyScalar(Math.exp(-damping * dt));
  current.addScaledVector(velocity, dt);
}

function CameraRig({ realm, reducedMotion }) {
  const { camera, pointer } = useThree();
  const velocity = useRef(new Vector3());
  const lookVelocity = useRef(new Vector3());
  const look = useRef(new Vector3(1.4, 1.7, -4.0));

  const framing = useMemo(() => {
    if (realm === 'war-room') return { x: 0.3, y: 3.75, z: 12.7, lookX: 1.2, lookY: 1.35, lookZ: -3.7, fov: 38 };
    if (realm === 'ministers-hall') return { x: 0.1, y: 3.6, z: 12.3, lookX: 1.35, lookY: 1.55, lookZ: -4.1, fov: 39 };
    if (realm === 'dragon-forge') return { x: -0.15, y: 3.15, z: 12.0, lookX: 1.4, lookY: 1.55, lookZ: -4.1, fov: 39 };
    return { x: 0, y: 3.25, z: 12.15, lookX: 1.4, lookY: 1.62, lookZ: -4.15, fov: 39 };
  }, [realm]);

  useFrame((_, delta) => {
    const px = reducedMotion ? 0 : MathUtils.clamp(pointer.x, -1, 1);
    const py = reducedMotion ? 0 : MathUtils.clamp(pointer.y, -1, 1);
    const targetPosition = new Vector3(
      framing.x + px * 0.14,
      framing.y + py * 0.055,
      framing.z
    );
    const targetLook = new Vector3(
      framing.lookX + px * 0.28,
      framing.lookY + py * 0.035,
      framing.lookZ
    );

    springVector(camera.position, velocity.current, targetPosition, delta);
    springVector(look.current, lookVelocity.current, targetLook, delta);
    camera.fov = MathUtils.damp(camera.fov, framing.fov, 4.2, delta);
    camera.updateProjectionMatrix();
    camera.lookAt(look.current);
  });

  return null;
}

function FireLight({ position, color, intensity = 2.2, reducedMotion }) {
  const light = useRef(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    const flicker = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 7.1 + position[0]) * 0.12;
    light.current.intensity = intensity + flicker;
  });
  return <pointLight ref={light} position={position} color={color} intensity={intensity} distance={9} decay={2} />;
}

function Ground({ accent, realm }) {
  const groundColor = realm === 'dragon-forge' ? '#191324' : GROUND;
  return (
    <>
      <mesh position={[0, -0.1, -1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[38, 30]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>
      <mesh position={[2.1, -0.07, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.8, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.025} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

function Road({ realm, accent }) {
  if (realm === 'ministers-hall' || realm === 'war-room') return null;
  return (
    <group rotation={[0, -0.08, 0]}>
      {Array.from({ length: 11 }, (_, index) => {
        const t = index / 10;
        const z = 5.4 - t * 10.6;
        const x = 0.25 + t * 1.0;
        const width = 1.6 + t * 0.65;
        return (
          <mesh key={index} position={[x, 0.005, z]} receiveShadow>
            <boxGeometry args={[width, 0.06, 0.72]} />
            <meshStandardMaterial color={index % 2 ? '#263757' : '#2c3e61'} roughness={0.98} emissive={accent} emissiveIntensity={0.025} />
          </mesh>
        );
      })}
    </group>
  );
}

function CouncilTable({ accent, warRoom = false }) {
  return (
    <group position={[1.1, 0, 1.25]}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[warRoom ? 2.2 : 1.85, warRoom ? 2.2 : 1.85, 0.18, warRoom ? 8 : 32]} />
        <meshStandardMaterial color="#4c362e" roughness={0.8} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <circleGeometry args={[warRoom ? 1.78 : 1.45, warRoom ? 8 : 48]} />
        <meshStandardMaterial color="#172542" roughness={0.72} emissive={accent} emissiveIntensity={0.035} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <mesh key={angle} position={[Math.cos(angle) * 0.75, 0.89, Math.sin(angle) * 0.75]} castShadow>
          <cylinderGeometry args={[0.08, 0.11, 0.16, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} metalness={0.45} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

function DragonForgeProps({ accent, secondary, reducedMotion }) {
  return (
    <group>
      <mesh position={[1.0, 0.55, 1.15]} castShadow>
        <boxGeometry args={[1.65, 0.62, 0.82]} />
        <meshStandardMaterial color="#282333" roughness={0.72} metalness={0.45} />
      </mesh>
      <mesh position={[1.0, 0.91, 1.15]} castShadow>
        <boxGeometry args={[1.0, 0.15, 0.48]} />
        <meshStandardMaterial color="#4d5361" roughness={0.5} metalness={0.72} />
      </mesh>
      <FireLight position={[-2.6, 1.05, -1.5]} color={accent} intensity={3.0} reducedMotion={reducedMotion} />
      <FireLight position={[4.2, 1.05, -2.0]} color={secondary} intensity={1.6} reducedMotion={reducedMotion} />
      <AuthoredModel name="sword" position={[1.15, 1.02, 1.1]} rotation={[0, 0, -1.34]} targetHeight={1.8} color="#d0d7e2" metalness={0.78} roughness={0.24} emissive={accent} emissiveIntensity={0.08} />
    </group>
  );
}

function TrainingProps({ accent }) {
  return (
    <group>
      <AuthoredModel name="trebuchet" position={[5.1, 0, 0.5]} rotation={[0, -0.7, 0]} targetHeight={2.1} color="#5d4437" roughness={0.82} />
      {[-2.2, -0.4].map((x, index) => (
        <group key={x} position={[x, 0, 0.8 - index * 0.45]}>
          <mesh position={[0, 1.2, 0]} rotation={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.58, 0.58, 0.1, 24]} />
            <meshStandardMaterial color="#6a4632" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.2, 0.06]} rotation={[0, 0.2, 0]}>
            <ringGeometry args={[0.18, 0.42, 24]} />
            <meshBasicMaterial color={accent} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.08, 1.1, 0.08]} /><meshStandardMaterial color="#3d2c25" roughness={0.9} /></mesh>
        </group>
      ))}
    </group>
  );
}

function RealmProps({ realm, accent, secondary, reducedMotion }) {
  if (realm === 'training-yard') return <TrainingProps accent={accent} />;
  if (realm === 'ministers-hall') return <CouncilTable accent={accent} />;
  if (realm === 'war-room') return <CouncilTable accent={accent} warRoom />;
  if (realm === 'dragon-forge') return <DragonForgeProps accent={accent} secondary={secondary} reducedMotion={reducedMotion} />;
  if (realm === 'armory') {
    return <AuthoredModel name="sword" position={[4.8, 0.45, 0.2]} rotation={[0.18, 0, -0.78]} targetHeight={2.45} color="#c9d2e1" metalness={0.76} roughness={0.24} emissive={accent} emissiveIntensity={0.08} />;
  }
  return null;
}

function Scene({ realm, accent, secondary, reducedMotion, mobile }) {
  const fogColor = realm === 'dragon-forge' ? '#171021' : '#101c38';
  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, 11, 34]} />
      <ambientLight intensity={0.48} color="#8297c1" />
      <hemisphereLight args={['#93a9d2', '#10162b', 0.72]} />
      <directionalLight
        position={[-8, 12, 7]}
        intensity={1.35}
        color="#bdd0ef"
        castShadow={!mobile}
        shadow-mapSize-width={768}
        shadow-mapSize-height={768}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={11}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={35}
      />
      <directionalLight position={[8, 6, 2]} intensity={0.34} color={secondary} />
      <pointLight position={[2.0, 3.2, -3.6]} color={accent} intensity={1.65} distance={15} decay={2} />

      <Ground accent={accent} realm={realm} />
      <Road realm={realm} accent={accent} />
      <Suspense fallback={null}>
        <AuthoredDistrictArchitecture realm={realm} accent={accent} secondary={secondary} mobile={mobile} />
        <RealmProps realm={realm} accent={accent} secondary={secondary} reducedMotion={reducedMotion} />
      </Suspense>
      <CameraRig realm={realm} reducedMotion={reducedMotion} />
    </>
  );
}

export default function RouteRealmCanvas({ realm, accent, secondary, active = true, reducedMotion = false }) {
  const mobile = useMobile();
  const dpr = mobile ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.32);

  return (
    <Canvas
      dpr={dpr}
      frameloop={active && !reducedMotion ? 'always' : 'demand'}
      shadows={!mobile}
      gl={{ antialias: !mobile, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 3.25, 12.15], fov: 39, near: 0.1, far: 80 }}
      performance={{ min: 0.76 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = mobile ? 1.12 : 1.2;
        gl.outputColorSpace = SRGBColorSpace;
        if (!mobile) gl.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      <Scene realm={realm} accent={accent} secondary={secondary} reducedMotion={reducedMotion} mobile={mobile} />
    </Canvas>
  );
}
