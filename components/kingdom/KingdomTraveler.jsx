'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const KingdomTraveler = forwardRef(function KingdomTraveler({ walking = false }, ref) {
  const root = useRef(null);
  const body = useRef(null);
  const cloak = useRef(null);
  const legLeft = useRef(null);
  const legRight = useRef(null);
  const armLeft = useRef(null);
  const armRight = useRef(null);
  const lantern = useRef(null);

  useImperativeHandle(ref, () => root.current);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cadence = walking ? 7.6 : 1.25;
    const swing = walking ? Math.sin(t * cadence) * 0.48 : Math.sin(t * cadence) * 0.025;
    const bob = walking ? Math.abs(Math.sin(t * cadence)) * 0.045 : Math.sin(t * cadence) * 0.014;

    if (body.current) body.current.position.y = bob;
    if (legLeft.current) legLeft.current.rotation.x = swing;
    if (legRight.current) legRight.current.rotation.x = -swing;
    if (armLeft.current) armLeft.current.rotation.x = -swing * 0.55;
    if (armRight.current) armRight.current.rotation.x = swing * 0.55;
    if (cloak.current) cloak.current.rotation.z = Math.sin(t * (walking ? 5.2 : 1.1)) * (walking ? 0.025 : 0.012);
    if (lantern.current) lantern.current.rotation.z = Math.sin(t * cadence + 0.8) * (walking ? 0.14 : 0.035);
  });

  return (
    <group ref={root} scale={1.05}>
      <group ref={body}>
        <group ref={cloak}>
          <mesh position={[0, 1.02, 0.06]}>
            <coneGeometry args={[0.4, 1.18, 10]} />
            <meshStandardMaterial color="#151b35" roughness={0.94} />
          </mesh>
          <mesh position={[0, 1.43, -0.03]} scale={[1, 0.72, 0.86]}>
            <sphereGeometry args={[0.39, 12, 10]} />
            <meshStandardMaterial color="#242d52" roughness={0.9} />
          </mesh>
        </group>

        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.17, 12, 12]} />
          <meshStandardMaterial color="#7b6247" roughness={0.88} />
        </mesh>
        <mesh position={[0, 1.73, 0.025]} scale={[1.18, 0.9, 1.05]}>
          <sphereGeometry args={[0.205, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
          <meshStandardMaterial color="#0d1228" roughness={1} />
        </mesh>

        <mesh position={[0, 1.23, -0.28]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.32, 0.46, 0.16]} />
          <meshStandardMaterial color="#312719" roughness={0.92} />
        </mesh>

        <group ref={legLeft} position={[-0.115, 0.58, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.58, 7]} />
            <meshStandardMaterial color="#11162a" roughness={0.94} />
          </mesh>
          <mesh position={[0, -0.56, 0.08]} scale={[1, 0.55, 1.45]}>
            <boxGeometry args={[0.15, 0.18, 0.3]} />
            <meshStandardMaterial color="#0a0e1d" roughness={1} />
          </mesh>
        </group>

        <group ref={legRight} position={[0.115, 0.58, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.58, 7]} />
            <meshStandardMaterial color="#11162a" roughness={0.94} />
          </mesh>
          <mesh position={[0, -0.56, 0.08]} scale={[1, 0.55, 1.45]}>
            <boxGeometry args={[0.15, 0.18, 0.3]} />
            <meshStandardMaterial color="#0a0e1d" roughness={1} />
          </mesh>
        </group>

        <group ref={armLeft} position={[-0.34, 1.34, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.052, 0.06, 0.46, 7]} />
            <meshStandardMaterial color="#1b2341" roughness={0.92} />
          </mesh>
        </group>

        <group ref={armRight} position={[0.34, 1.34, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.052, 0.06, 0.46, 7]} />
            <meshStandardMaterial color="#1b2341" roughness={0.92} />
          </mesh>
          <group ref={lantern} position={[0.02, -0.45, 0.05]}>
            <mesh position={[0, -0.09, 0]}>
              <boxGeometry args={[0.18, 0.25, 0.18]} />
              <meshStandardMaterial color="#3a2a18" roughness={0.82} metalness={0.15} />
            </mesh>
            <mesh position={[0, -0.09, 0]}>
              <boxGeometry args={[0.11, 0.17, 0.11]} />
              <meshBasicMaterial color="#f0c669" toneMapped={false} />
            </mesh>
            <pointLight position={[0, -0.08, 0.02]} color="#d9a94e" intensity={1.2} distance={3.5} decay={2} />
          </group>
        </group>

        <group position={[-0.24, 1.2, -0.25]} rotation={[0.08, 0.12, -0.12]}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.045, 0.86, 0.035]} />
            <meshStandardMaterial color="#6e7380" metalness={0.72} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.18, 0.035, 0.055]} />
            <meshStandardMaterial color="#8d6c32" metalness={0.45} roughness={0.42} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

export default KingdomTraveler;
