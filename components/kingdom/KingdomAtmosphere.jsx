'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import { AdditiveBlending, CanvasTexture } from 'three';

function useSoftTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 64, 4, 128, 64, 118);
    gradient.addColorStop(0, 'rgba(255,255,255,0.78)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.38)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.10)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function MistBank({ position, scale, drift = 0.4, opacity = 0.12, phase = 0 }) {
  const ref = useRef(null);
  const texture = useSoftTexture();
  const base = useMemo(() => ({ x: position[0], y: position[1], z: position[2] }), [position]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * drift + phase;
    ref.current.position.x = base.x + Math.sin(t) * 1.4;
    ref.current.position.y = base.y + Math.sin(t * 0.63) * 0.08;
    ref.current.material.opacity = opacity * (0.86 + Math.sin(t * 0.72) * 0.10);
  });

  if (!texture) return null;

  return (
    <sprite ref={ref} position={position} scale={scale}>
      <spriteMaterial
        map={texture}
        color="#b8c8e7"
        transparent
        opacity={opacity}
        depthWrite={false}
        fog
      />
    </sprite>
  );
}

function Moon() {
  const texture = useSoftTexture();
  return (
    <group position={[-10.5, 10.8, -42]}>
      {texture && (
        <sprite scale={[13.5, 13.5, 1]}>
          <spriteMaterial
            map={texture}
            color="#cbd8f2"
            transparent
            opacity={0.38}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}
      <mesh>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color="#edf3ff" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function KingdomAtmosphere({ activeRoad }) {
  const roadColor = activeRoad === 'left' ? '#e4b85b' : activeRoad === 'right' ? '#9ebef1' : '#e77a4a';

  return (
    <>
      <Stars radius={54} depth={36} count={950} factor={2.45} saturation={0.08} fade speed={0.13} />
      <Moon />

      <MistBank position={[-7.5, 0.75, -3.5]} scale={[13, 3.3, 1]} drift={0.24} opacity={0.14} phase={0.5} />
      <MistBank position={[6.8, 0.62, -5.5]} scale={[14, 3.6, 1]} drift={0.2} opacity={0.13} phase={2.2} />
      <MistBank position={[0.4, 0.42, 2.1]} scale={[12, 2.5, 1]} drift={0.28} opacity={0.075} phase={4.1} />
      <MistBank position={[1.2, 1.05, -13]} scale={[20, 4.8, 1]} drift={0.13} opacity={0.10} phase={1.4} />

      <Sparkles count={62} scale={[18, 5, 15]} position={[0, 1.8, -2]} size={1.55} speed={0.18} color={roadColor} opacity={0.40} />
    </>
  );
}
