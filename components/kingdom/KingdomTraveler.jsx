'use client';

import { forwardRef, useRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';

// A stylized, low-poly cloaked traveler built from primitives. Not a
// focal point -- exists to give the scene scale and a sense of following
// someone toward the gate.
const KingdomTraveler = forwardRef(function KingdomTraveler({ walking = false }, ref) {
  const group = useRef(null);
  const legL = useRef(null);
  const legR = useRef(null);
  const armL = useRef(null);
  const armR = useRef(null);

  useImperativeHandle(ref, () => group.current);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const bob = Math.sin(t * (walking ? 8 : 1.6)) * (walking ? 0.05 : 0.02);
    if (group.current) group.current.position.y = bob;
    const swing = walking ? Math.sin(t * 8) * 0.5 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.6;
    if (armR.current) armR.current.rotation.x = swing * 0.6;
  });

  return (
    <group ref={group}>
      {/* cloak / torso */}
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[0.34, 1.05, 8]} />
        <meshStandardMaterial color="#1c2340" roughness={0.9} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#3a3226" roughness={0.8} />
      </mesh>
      {/* hood shadow */}
      <mesh position={[0, 1.66, 0.03]}>
        <sphereGeometry args={[0.18, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color="#10142a" roughness={1} />
      </mesh>
      {/* legs */}
      <group ref={legL} position={[-0.1, 0.55, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.55, 6]} />
          <meshStandardMaterial color="#181b2e" roughness={0.9} />
        </mesh>
      </group>
      <group ref={legR} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.55, 6]} />
          <meshStandardMaterial color="#181b2e" roughness={0.9} />
        </mesh>
      </group>
      {/* arms */}
      <group ref={armL} position={[-0.28, 1.28, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.42, 6]} />
          <meshStandardMaterial color="#1c2340" roughness={0.9} />
        </mesh>
      </group>
      <group ref={armR} position={[0.28, 1.28, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.42, 6]} />
          <meshStandardMaterial color="#1c2340" roughness={0.9} />
        </mesh>
      </group>
      {/* faint ember glow the traveler carries */}
      <pointLight position={[0.28, 1.1, 0.1]} color="#d9622d" intensity={0.6} distance={2.2} decay={2} />
    </group>
  );
});

export default KingdomTraveler;
