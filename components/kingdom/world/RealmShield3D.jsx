'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function ShieldMesh() {
  const group = useRef();
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.65);
    shape.lineTo(1.28, 1.08);
    shape.lineTo(1.12, -0.62);
    shape.quadraticCurveTo(0.82, -1.42, 0, -1.9);
    shape.quadraticCurveTo(-0.82, -1.42, -1.12, -0.62);
    shape.lineTo(-1.28, 1.08);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 4 });
    geo.center();
    return geo;
  }, []);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.18 + Math.sin(t * 0.4) * 0.035, 0.045);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.1 + Math.cos(t * 0.45) * 0.025, 0.045);
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#17181b" metalness={0.82} roughness={0.27} />
      </mesh>
      <mesh position={[0, 0, 0.19]} scale={0.82} geometry={geometry}>
        <meshStandardMaterial color="#4b2d1c" metalness={0.7} roughness={0.34} emissive="#6e2c0d" emissiveIntensity={0.24} />
      </mesh>
      <mesh position={[0, 0, 0.41]}>
        <torusGeometry args={[0.64, 0.045, 16, 64]} />
        <meshStandardMaterial color="#d3a45f" metalness={0.95} roughness={0.22} emissive="#a65a22" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, -0.04, 0.46]}>
        <ringGeometry args={[0.2, 0.28, 6]} />
        <meshStandardMaterial color="#e8c37f" metalness={0.9} roughness={0.18} emissive="#d8782c" emissiveIntensity={0.36} />
      </mesh>
    </group>
  );
}

export default function RealmShield3D() {
  return (
    <div className="realm-shield-canvas" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.1, 5.3], fov: 32 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 5, 5]} intensity={2.2} color="#ffd59a" />
        <pointLight position={[-2.5, -1.2, 2.5]} intensity={18} distance={8} color="#d65c1f" />
        <pointLight position={[2.4, 1.4, 1.6]} intensity={10} distance={7} color="#f2b35d" />
        <Float speed={1.1} rotationIntensity={0.07} floatIntensity={0.18}>
          <ShieldMesh />
        </Float>
      </Canvas>
    </div>
  );
}
