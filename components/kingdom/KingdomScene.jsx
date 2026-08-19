'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import KingdomGate from './KingdomGate';
import KingdomTraveler from './KingdomTraveler';

const NIGHT = '#070a16';

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

  useFrame(({ pointer }, delta) => {
    if (active && phase === 'approach') approachElapsed.current += delta;
    if (phase === 'transitioning') transitionElapsed.current += delta;

    const approachT = active ? Math.min(approachElapsed.current / 2.2, 1) : 0;
    const hoverDirection = hoveredRoad === 'left' ? -1 : hoveredRoad === 'right' ? 1 : 0;

    let goalX = pointer.x * 0.18 + hoverDirection * 0.46;
    let goalY = 2.72 + pointer.y * 0.08;
    let goalZ = 10.8 - approachT * 2.1;
    let lookX = hoverDirection * 1.9;
    let lookY = 1.65;
    let lookZ = -3.4;

    if (phase === 'transitioning') {
      const direction = selectedRoad === 'left' ? -1 : 1;
      const t = Math.min(transitionElapsed.current / 1.25, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      goalX = direction * (0.65 + eased * 3.0);
      goalY = 2.55 - eased * 0.34;
      goalZ = 8.65 - eased * 5.25;
      lookX = direction * (2.2 + eased * 2.1);
      lookY = 1.45;
      lookZ = -5.2 - eased * 2.4;
    }

    const smoothing = 1 - Math.exp(-delta * (phase === 'transitioning' ? 3.8 : 2.5));
    camera.position.x += (goalX - camera.position.x) * smoothing;
    camera.position.y += (goalY - camera.position.y) * smoothing;
    camera.position.z += (goalZ - camera.position.z) * smoothing;

    const lookTarget = camera.userData.lookTarget || { x: 0, y: 1.65, z: -3.4 };
    lookTarget.x += (lookX - lookTarget.x) * smoothing;
    lookTarget.y += (lookY - lookTarget.y) * smoothing;
    lookTarget.z += (lookZ - lookTarget.z) * smoothing;
    camera.userData.lookTarget = lookTarget;
    camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
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
      const t = Math.min(approachElapsed.current / 2.2, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      group.current.position.z = 6.2 - eased * 2.75;
      group.current.position.x = Math.sin(t * Math.PI) * 0.08;
      group.current.rotation.y = Math.sin(t * Math.PI) * -0.03;
      return;
    }

    if (phase === 'transitioning') {
      transitionElapsed.current += delta;
      const direction = selectedRoad === 'left' ? -1 : 1;
      const t = Math.min(transitionElapsed.current / 1.25, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      group.current.position.x = direction * (0.08 + eased * 3.25);
      group.current.position.z = 3.45 - eased * 8.15;
      group.current.rotation.y = direction * eased * 0.36;
      return;
    }

    group.current.position.z += (3.45 - group.current.position.z) * Math.min(delta * 4, 1);
    group.current.position.x += (0 - group.current.position.x) * Math.min(delta * 4, 1);
    group.current.rotation.y += (0 - group.current.rotation.y) * Math.min(delta * 4, 1);
  });

  return (
    <group ref={group} position={[0, 0, 6.2]}>
      <KingdomTraveler walking={active && (phase === 'approach' || phase === 'transitioning')} />
    </group>
  );
}

function SceneContents({ hoveredRoad, phase, selectedRoad, active }) {
  const leftActive = hoveredRoad === 'left' || selectedRoad === 'left';
  const rightActive = hoveredRoad === 'right' || selectedRoad === 'right';

  return (
    <>
      <color attach="background" args={[NIGHT]} />
      <fog attach="fog" args={[NIGHT, 10, phase === 'transitioning' ? 24 : 34]} />

      <ambientLight intensity={0.44} color="#53618f" />
      <hemisphereLight args={['#40507f', '#050711', 0.7]} />
      <directionalLight position={[-8, 11, 8]} intensity={0.95} color="#8191c2" />
      <pointLight position={[-4, 3.1, -4.5]} color="#d9a94e" intensity={leftActive ? 3.1 : 1.35} distance={17} decay={2} />
      <pointLight position={[4, 3.1, -4.5]} color="#7594c8" intensity={rightActive ? 3.1 : 1.25} distance={17} decay={2} />

      <KingdomGate hoveredRoad={hoveredRoad} selectedRoad={selectedRoad} />
      <TravelerRig phase={phase} selectedRoad={selectedRoad} active={active} />
      <CameraRig hoveredRoad={hoveredRoad} phase={phase} selectedRoad={selectedRoad} active={active} />
    </>
  );
}

export default function KingdomScene({ hoveredRoad, phase, selectedRoad, active }) {
  const dpr = useMemo(
    () => (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.55) : 1),
    []
  );

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 44, near: 0.1, far: 90, position: [0, 2.72, 10.8] }}
      shadows={false}
    >
      <SceneContents hoveredRoad={hoveredRoad} phase={phase} selectedRoad={selectedRoad} active={active} />
    </Canvas>
  );
}
