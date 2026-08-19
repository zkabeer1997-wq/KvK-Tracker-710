'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  MathUtils,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Vector3,
} from 'three';
import KingdomAtmosphere from './KingdomAtmosphere';
import KingdomGroundDetails from './KingdomGroundDetails';
import AnimatedKnightTraveler from './AnimatedKnightTraveler';
import { AuthoredEntranceArchitecture } from './AuthoredCastleAssets';

const TWILIGHT = '#0d1530';
const UP = new Vector3(0, 1, 0);

function smoothstep(t) {
  const x = MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function springVector(current, velocity, target, delta, stiffness = 58, damping = 14) {
  const dt = Math.min(delta, 1 / 30);
  velocity.addScaledVector(target.clone().sub(current), stiffness * dt);
  velocity.multiplyScalar(Math.exp(-damping * dt));
  current.addScaledVector(velocity, dt);
}

function springScalar(state, target, delta, stiffness = 48, damping = 13) {
  const dt = Math.min(delta, 1 / 30);
  state.velocity += (target - state.value) * stiffness * dt;
  state.velocity *= Math.exp(-damping * dt);
  state.value += state.velocity * dt;
  return state.value;
}

function buildRouteCurve(direction, y = 0) {
  return new CatmullRomCurve3([
    new Vector3(0, y, 3.85),
    new Vector3(direction * 0.45, y, 2.5),
    new Vector3(direction * 1.55, y, 0.25),
    new Vector3(direction * 3.05, y, -3.25),
    new Vector3(direction * 4.35, y, -6.55),
    new Vector3(direction * 4.65, y, -9.25),
  ]);
}

function CameraRig({ hoveredRoad, phase, selectedRoad, active }) {
  const { camera, pointer } = useThree();
  const phaseTime = useRef(0);
  const previousPhase = useRef(phase);
  const velocity = useRef(new Vector3());
  const lookVelocity = useRef(new Vector3());
  const look = useRef(new Vector3(0, 1.7, -2.6));
  const fov = useRef({ value: 48, velocity: 0 });
  const roll = useRef({ value: 0, velocity: 0 });

  const cameraRoutes = useMemo(() => ({
    left: new CatmullRomCurve3([
      new Vector3(0, 2.72, 9.65),
      new Vector3(-0.38, 2.78, 8.0),
      new Vector3(-1.35, 2.72, 5.25),
      new Vector3(-2.9, 2.58, 1.1),
      new Vector3(-4.15, 2.46, -3.8),
      new Vector3(-4.55, 2.42, -7.0),
    ]),
    right: new CatmullRomCurve3([
      new Vector3(0, 2.72, 9.65),
      new Vector3(0.38, 2.78, 8.0),
      new Vector3(1.35, 2.72, 5.25),
      new Vector3(2.9, 2.58, 1.1),
      new Vector3(4.15, 2.46, -3.8),
      new Vector3(4.55, 2.42, -7.0),
    ]),
  }), []);

  useEffect(() => {
    if (previousPhase.current !== phase) {
      phaseTime.current = 0;
      previousPhase.current = phase;
    }
  }, [phase]);

  useFrame(({ clock }, delta) => {
    if (active || phase === 'transitioning') phaseTime.current += delta;
    const hoverDirection = hoveredRoad === 'left' ? -1 : hoveredRoad === 'right' ? 1 : 0;
    const pointerX = MathUtils.clamp(pointer.x, -1, 1);
    const pointerY = MathUtils.clamp(pointer.y, -1, 1);
    const targetPosition = new Vector3();
    const targetLook = new Vector3();
    let targetFov = 43.6;
    let targetRoll = 0;

    if (phase === 'approach') {
      const t = smoothstep(phaseTime.current / 2.55);
      targetPosition.set(
        Math.sin(t * Math.PI) * -0.08,
        3.28 - t * 0.54,
        13.35 - t * 3.7
      );
      targetLook.set(0, 1.66, -2.2 - t * 2.15);
      targetFov = 48 - t * 4.4;
    } else if (phase === 'transitioning' && selectedRoad) {
      const t = smoothstep(phaseTime.current / 1.38);
      const curve = cameraRoutes[selectedRoad];
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(Math.min(0.99, t + 0.015));
      targetPosition.copy(point);
      targetPosition.y += Math.sin(t * Math.PI) * 0.16;
      targetLook.copy(point).addScaledVector(tangent, 7.2);
      targetLook.y = 1.48;
      targetFov = 43.2 + t * 4.6;
      targetRoll = (selectedRoad === 'left' ? 1 : -1) * Math.sin(t * Math.PI) * 0.012;
    } else {
      const breathing = Math.sin(clock.getElapsedTime() * 0.32) * 0.018;
      targetPosition.set(pointerX * 0.11 + breathing, 2.74 + pointerY * 0.035, 9.65);
      targetLook.set(hoverDirection * 1.8 + pointerX * 0.18, 1.58 + pointerY * 0.025, -4.45);
      targetFov = 43.6 - Math.abs(hoverDirection) * 0.35;
      targetRoll = hoverDirection * -0.003;
    }

    springVector(camera.position, velocity.current, targetPosition, delta, phase === 'transitioning' ? 86 : 56, phase === 'transitioning' ? 16 : 14);
    springVector(look.current, lookVelocity.current, targetLook, delta, phase === 'transitioning' ? 80 : 54, phase === 'transitioning' ? 16 : 14);
    camera.fov = springScalar(fov.current, targetFov, delta);
    camera.updateProjectionMatrix();
    camera.lookAt(look.current);
    camera.rotation.z = springScalar(roll.current, targetRoll, delta, 42, 13);
  });

  return null;
}

function TravelerRig({ phase, selectedRoad, active }) {
  const group = useRef(null);
  const phaseTime = useRef(0);
  const previousPhase = useRef(phase);
  const leftRoute = useMemo(() => buildRouteCurve(-1), []);
  const rightRoute = useMemo(() => buildRouteCurve(1), []);

  useEffect(() => {
    if (previousPhase.current !== phase) {
      phaseTime.current = 0;
      previousPhase.current = phase;
    }
  }, [phase]);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (active || phase === 'transitioning') phaseTime.current += delta;

    if (phase === 'approach') {
      const t = smoothstep(phaseTime.current / 2.55);
      group.current.position.set(
        Math.sin(t * Math.PI) * -0.055,
        0,
        7.7 - t * 3.85
      );
      group.current.rotation.y = Math.sin(t * Math.PI) * -0.025;
      return;
    }

    if (phase === 'transitioning' && selectedRoad) {
      const t = smoothstep(phaseTime.current / 1.4);
      const curve = selectedRoad === 'left' ? leftRoute : rightRoute;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(Math.min(0.995, t + 0.01)).projectOnPlane(UP).normalize();
      group.current.position.copy(point);
      group.current.rotation.y = Math.atan2(tangent.x, tangent.z);
      return;
    }

    group.current.position.set(0, 0, 3.85);
    group.current.rotation.y *= Math.exp(-delta * 8);
  });

  return (
    <group ref={group} position={[0, 0, 7.7]}>
      <Suspense fallback={null}>
        <AnimatedKnightTraveler walking={active && (phase === 'approach' || phase === 'transitioning')} />
      </Suspense>
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
      <fog attach="fog" args={[TWILIGHT, phase === 'transitioning' ? 7 : 12.5, phase === 'transitioning' ? 29 : 43]} />

      <ambientLight intensity={0.38} color="#7a8ebb" />
      <hemisphereLight args={['#9ab0d8', '#101831', 0.82]} />
      <directionalLight
        position={[-9, 14, 7]}
        intensity={1.7}
        color="#becff1"
        castShadow={!mobile}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={15}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={42}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[9, 7, 4]} intensity={0.42} color="#718cc1" />
      <pointLight position={[-4.5, 2.8, -6.0]} color="#e4b85b" intensity={leftActive ? 4.4 : 1.45} distance={16} decay={2} />
      <pointLight position={[4.5, 2.8, -6.0]} color="#94b5eb" intensity={rightActive ? 4.2 : 1.35} distance={16} decay={2} />

      <KingdomAtmosphere activeRoad={activeRoad} />
      <KingdomGroundDetails hoveredRoad={hoveredRoad} selectedRoad={selectedRoad} mobile={mobile} />
      <Suspense fallback={null}>
        <AuthoredEntranceArchitecture activeRoad={activeRoad} mobile={mobile} />
      </Suspense>
      <TravelerRig phase={phase} selectedRoad={selectedRoad} active={active} />
      <CameraRig hoveredRoad={hoveredRoad} phase={phase} selectedRoad={selectedRoad} active={active} />
    </>
  );
}

export default function KingdomScene({ hoveredRoad, phase, selectedRoad, active }) {
  const mobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 760, []);
  const dpr = useMemo(
    () => (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, mobile ? 1.08 : 1.48) : 1),
    [mobile]
  );

  return (
    <Canvas
      dpr={dpr}
      shadows={!mobile}
      gl={{ antialias: !mobile, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 48, near: 0.1, far: 100, position: [0, 3.28, 13.35] }}
      performance={{ min: 0.72 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = mobile ? 1.2 : 1.28;
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
