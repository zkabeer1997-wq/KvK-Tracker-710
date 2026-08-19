'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import KingdomAtmosphere from './KingdomAtmosphere';
import KingdomGate from './KingdomGate';
import KingdomTraveler from './KingdomTraveler';

const TWILIGHT = '#0d1530';

function CameraRig({ hoveredRoad, phase, selectedRoad, active }) {
  const { camera } = useThree();
  const approachElapsed = useRef(0);
  const transitionElapsed = useRef(0);
  const previousPhase = useRef(phase);

  useEffect(() => {
    if (previousPhase.current !== phase) {
      if (phase === 'approach') approachElapsed.current = 0;
      if (phase === 'transitioning') transitionElapsed.current = 0;
      previousPhase.current = phase;
    }
  }, [phase]);

  useFrame(({ pointer, clock }, delta) => {
    if (active && phase === 'approach') approachElapsed.current += delta;
    if (phase === 'transitioning') transitionElapsed.current += delta;

    const approachT = active ? Math.min(approachElapsed.current / 2.55, 1) : 0;
    const approachEase = 1 - Math.pow(1 - approachT, 4);
    const hoverDirection = hoveredRoad === 'left' ? -1 : hoveredRoad === 'right' ? 1 : 0;
    const idleDrift = phase === 'idle' ? Math.sin(clock.getElapsedTime() * 0.25) * 0.05 : 0;

    let goalX = pointer.x * 0.22 + hoverDirection * 0.58 + idleDrift;
    let goalY = 3.25 - approachEase * 0.5 + pointer.y * 0.09;
    let goalZ = 13.2 - approachEase * 3.55 - Math.abs(hoverDirection) * 0.22;
    let lookX = hoverDirection * 2.35;
    let lookY = 1.72;
    let lookZ = -2.2 - approachEase * 2.15;
    let goalFov = 48 - approachEase * 5.2;
    let goalRoll = hoverDirection * -0.008;

    if (phase === 'transitioning') {
      const direction = selectedRoad === 'left' ? -1 : 1;
      const t = Math.min(transitionElapsed.current / 1.4, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      goalX = direction * (0.7 + eased * 3.8);
      goalY = 2.7 - eased * 0.52;
      goalZ = 9.35 - eased * 8.0;
      lookX = direction * (2.3 + eased * 2.25);
      lookY = 1.46 - eased * 0.08;
      lookZ = -5.0 - eased * 5.8;
      goalFov = 42.8 + eased * 7.5;
      goalRoll = direction * -0.022 * eased;
    }

    const smoothing = 1 - Math.exp(-delta * (phase === 'transitioning' ? 4.2 : 2.35));
    camera.position.x += (goalX - camera.position.x) * smoothing;
    camera.position.y += (goalY - camera.position.y) * smoothing;
    camera.position.z += (goalZ - camera.position.z) * smoothing;
    camera.fov += (goalFov - camera.fov) * smoothing;
    camera.updateProjectionMatrix();

    const lookTarget = camera.userData.lookTarget || { x: 0, y: 1.72, z: -2.2 };
    lookTarget.x += (lookX - lookTarget.x) * smoothing;
    lookTarget.y += (lookY - lookTarget.y) * smoothing;
    lookTarget.z += (lookZ - lookTarget.z) * smoothing;
    camera.userData.lookTarget = lookTarget;
    camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
    camera.rotation.z += (goalRoll - camera.rotation.z) * smoothing;
  });

  return null;
}

function TravelerRig({ phase, selectedRoad, active }) {
  const group = useRef(null);
  const approachElapsed = useRef(0);
  const transitionElapsed = useRef(0);
  const previousPhase = useRef(phase);

  useEffect(() => {
    if (previousPhase.current !== phase) {
      if (phase === 'approach') approachElapsed.current = 0;
      if (phase === 'transitioning') transitionElapsed.current = 0;
      previousPhase.current = phase;
    }
  }, [phase]);

  useFrame((_, delta) => {
    if (!group.current) return;

    if (active && phase === 'approach') {
      approachElapsed.current += delta;
      const t = Math.min(approachElapsed.current / 2.55, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      group.current.position.z = 7.55 - eased * 3.82;
      group.current.position.x = Math.sin(t * Math.PI) * 0.07;
      group.current.rotation.y = Math.sin(t * Math.PI) * -0.025;
      return;
    }

    if (phase === 'transitioning') {
      transitionElapsed.current += delta;
      const direction = selectedRoad === 'left' ? -1 : 1;
      const t = Math.min(transitionElapsed.current / 1.4, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      group.current.position.x = direction * (0.06 + eased * 4.2);
      group.current.position.z = 3.73 - eased * 11.6;
      group.current.rotation.y = direction * eased * 0.42;
      return;
    }

    group.current.position.z += (3.73 - group.current.position.z) * Math.min(delta * 4, 1);
    group.current.position.x += (0 - group.current.position.x) * Math.min(delta * 4, 1);
    group.current.rotation.y += (0 - group.current.rotation.y) * Math.min(delta * 4, 1);
  });

  return (
    <group ref={group} position={[0, 0, 7.55]}>
      <KingdomTraveler walking={active && (phase === 'approach' || phase === 'transitioning')} />
    </group>
  );
}

function SceneContents({ hoveredRoad, phase, selectedRoad, active, mobile }) {
  const leftActive = hoveredRoad === 'left' || selectedRoad === 'left';
  const rightActive = hoveredRoad === 'right' || selectedRoad === 'right';
  const activeRoad = selectedRoad || hoveredRoad;

  return (
    <>
      <color attach="background" args={[TWILIGHT]} />
      <fog attach="fog" args={[TWILIGHT, phase === 'transitioning' ? 8 : 13, phase === 'transitioning' ? 31 : 44]} />

      <ambientLight intensity={0.48} color="#778bbc" />
      <hemisphereLight args={['#91a9d8', '#0c1428', 0.92]} />
      <directionalLight
        position={[-10, 13, 8]}
        intensity={1.72}
        color="#b5c8ee"
        castShadow={!mobile}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={14}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[9, 7, 5]} intensity={0.56} color="#7d95c9" />
      <pointLight position={[0, 6.5, 5.5]} color="#c3b6e4" intensity={0.82} distance={26} decay={2} />
      <pointLight position={[-4.2, 3.2, -4.6]} color="#e4b85b" intensity={leftActive ? 5.0 : 2.05} distance={21} decay={2} />
      <pointLight position={[4.2, 3.2, -4.6]} color="#94b5eb" intensity={rightActive ? 4.8 : 1.95} distance={21} decay={2} />

      <KingdomAtmosphere activeRoad={activeRoad} />
      <KingdomGate hoveredRoad={hoveredRoad} selectedRoad={selectedRoad} />
      <TravelerRig phase={phase} selectedRoad={selectedRoad} active={active} />
      <CameraRig hoveredRoad={hoveredRoad} phase={phase} selectedRoad={selectedRoad} active={active} />
    </>
  );
}

export default function KingdomScene({ hoveredRoad, phase, selectedRoad, active }) {
  const mobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 760, []);
  const dpr = useMemo(
    () => (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, mobile ? 1.22 : 1.58) : 1),
    [mobile]
  );

  return (
    <Canvas
      dpr={dpr}
      shadows={!mobile}
      gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 48, near: 0.1, far: 100, position: [0, 3.25, 13.2] }}
      performance={{ min: 0.65 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = mobile ? 1.26 : 1.34;
        gl.outputColorSpace = SRGBColorSpace;
        if (!mobile) gl.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      <SceneContents
        hoveredRoad={hoveredRoad}
        phase={phase}
        selectedRoad={selectedRoad}
        active={active}
        mobile={mobile}
      />
    </Canvas>
  );
}
