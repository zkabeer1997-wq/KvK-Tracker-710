'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import KingdomGate from './KingdomGate';
import KingdomTraveler from './KingdomTraveler';

const GOLD = '#d9a94e';
const BLUE = '#5c86c9';
const NAVY = '#0b0e1e';

function CameraRig({ hoveredRoad, phase, selectedRoad, elapsedSinceSelect }) {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 2.2, z: 9, lookX: 0 });

  useFrame((_, delta) => {
    let goalX = 0;
    let goalZ = 9;
    let lookX = 0;

    if (hoveredRoad === 'left') { goalX = -0.9; lookX = -1.4; }
    if (hoveredRoad === 'right') { goalX = 0.9; lookX = 1.4; }

    if (phase === 'transitioning') {
      const dir = selectedRoad === 'left' ? -1 : 1;
      const t = Math.min(elapsedSinceSelect.current, 1.6);
      goalX = dir * (0.9 + t * 2.6);
      goalZ = 9 - t * 6.5;
      lookX = dir * (1.4 + t * 3);
    }

    target.current.x += (goalX - target.current.x) * Math.min(delta * 2.2, 1);
    target.current.z += (goalZ - target.current.z) * Math.min(delta * 2.2, 1);
    target.current.lookX += (lookX - target.current.lookX) * Math.min(delta * 2.2, 1);

    camera.position.set(target.current.x, 2.2, target.current.z);
    camera.lookAt(target.current.lookX, 1.3, -3);
  });

  return null;
}

function SceneContents({ hoveredRoad, phase, selectedRoad, elapsedSinceSelect }) {
  const travelerRef = useRef(null);

  useFrame((_, delta) => {
    if (phase === 'transitioning') {
      elapsedSinceSelect.current += delta;
      if (travelerRef.current) {
        const dir = selectedRoad === 'left' ? -1 : 1;
        travelerRef.current.position.x = dir * Math.min(elapsedSinceSelect.current, 1.6) * 1.6;
        travelerRef.current.position.z = 3.2 - Math.min(elapsedSinceSelect.current, 1.6) * 4.5;
      }
    }
  });

  const accentColor = hoveredRoad === 'right' ? BLUE : GOLD;

  return (
    <>
      <color attach="background" args={[NAVY]} />
      <fog attach="fog" args={[NAVY, 8, phase === 'transitioning' ? 6 : 22]} />
      <ambientLight intensity={0.28} color="#2a3358" />
      <directionalLight position={[-6, 8, 4]} intensity={0.35} color="#6f7cad" />
      <hemisphereLight args={['#232c52', '#05060c', 0.4]} />

      <KingdomGate />
      <group ref={travelerRef} position={[0, 0, 3.4]}>
        <KingdomTraveler walking={phase === 'transitioning'} />
      </group>

      <CameraRig hoveredRoad={hoveredRoad} phase={phase} selectedRoad={selectedRoad} elapsedSinceSelect={elapsedSinceSelect} />
    </>
  );
}

export default function KingdomScene({ hoveredRoad, phase, selectedRoad }) {
  const elapsedSinceSelect = useRef(0);
  const dpr = useMemo(() => (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.6) : 1), []);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 42, position: [0, 2.2, 9] }}
      shadows={false}
    >
      <SceneContents
        hoveredRoad={hoveredRoad}
        phase={phase}
        selectedRoad={selectedRoad}
        elapsedSinceSelect={elapsedSinceSelect}
      />
    </Canvas>
  );
}
