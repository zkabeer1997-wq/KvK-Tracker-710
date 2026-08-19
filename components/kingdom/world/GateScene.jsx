'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, MathUtils } from 'three';

const GOLD = '#d9a94e';
const FIRE = '#e2692a';
const SKY_BLUE = '#3f74bd';
const GARNET = '#a3283c';
const NIGHT = '#05060d';

/* Scale is the whole point of this scene. The wall is ~24 units tall
   with the camera at 1.7 (human eye height), so the fortress reads as
   enormous rather than as a model on a table. */
const WALL_H = 24;
const GATE_W = 9;
const GATE_H = 15;

function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const s = 128;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.22, 'rgba(255,255,255,0.5)');
    rg.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, s, s);
    return new CanvasTexture(c);
  }, []);
}

/* --- Brazier: a real fire source, standing on a stone pillar. ----- */
function Brazier({ position, color = FIRE, scale = 1, intensity = 7 }) {
  const tex = useGlowTexture();
  const light = useRef(null);
  const glow = useRef(null);
  const seed = useRef(Math.random() * 10);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed.current;
    const f = Math.sin(t * 8.5) * 0.3 + Math.sin(t * 3.3) * 0.22 + Math.sin(t * 17) * 0.08;
    if (light.current) light.current.intensity = intensity * (1 + f * 0.22);
    if (glow.current) glow.current.scale.setScalar(scale * (2.6 + f * 0.34));
  });

  return (
    <group position={position}>
      {/* pillar */}
      <mesh position={[0, 1.5 * scale, 0]}>
        <cylinderGeometry args={[0.32 * scale, 0.46 * scale, 3 * scale, 8]} />
        <meshStandardMaterial color="#333a52" roughness={0.94} />
      </mesh>
      {/* bowl */}
      <mesh position={[0, 3.15 * scale, 0]}>
        <cylinderGeometry args={[0.72 * scale, 0.4 * scale, 0.55 * scale, 10]} />
        <meshStandardMaterial color="#2c2013" roughness={0.8} metalness={0.35} />
      </mesh>
      {tex && (
        <sprite ref={glow} position={[0, 3.6 * scale, 0]} scale={[2.6 * scale, 2.6 * scale, 1]}>
          <spriteMaterial
            map={tex}
            color={color}
            transparent
            opacity={0.95}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}
      <pointLight
        ref={light}
        position={[0, 3.7 * scale, 0]}
        color={color}
        intensity={intensity}
        distance={34 * scale}
        decay={2}
      />
    </group>
  );
}

/* --- Warband banner hanging on the wall -------------------------- */
function Banner({ position, color, height = 7, width = 1.8 }) {
  const ref = useRef(null);
  const seed = useRef(Math.random() * 6);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + seed.current;
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.022;
    ref.current.rotation.y = Math.sin(t * 0.6) * 0.05;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[width + 0.5, 0.16, 0.16]} />
        <meshStandardMaterial color="#3a3320" metalness={0.6} roughness={0.5} />
      </mesh>
      <group ref={ref}>
        <mesh position={[0, -height / 2, 0.02]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={color} side={2} roughness={0.85} />
        </mesh>
        {/* pennant tail */}
        <mesh position={[0, -height - 0.42, 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[width * 0.7, width * 0.7]} />
          <meshStandardMaterial color={color} side={2} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/* --- Tower ------------------------------------------------------- */
function Tower({ x, z = -30, h = WALL_H + 10, r = 4.2 }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r * 0.86, r, h, 10]} />
        <meshStandardMaterial color="#39415c" roughness={0.95} />
      </mesh>
      {/* crenellated cap */}
      <mesh position={[0, h + 0.7, 0]}>
        <cylinderGeometry args={[r * 1.12, r * 1.12, 1.4, 10]} />
        <meshStandardMaterial color="#2f3650" roughness={0.95} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * r * 1.05, h + 1.85, Math.sin(a) * r * 1.05]}>
            <boxGeometry args={[0.8, 1.1, 0.8]} />
            <meshStandardMaterial color="#2f3650" roughness={0.95} />
          </mesh>
        );
      })}
      {/* watchfire on top - signals an active kingdom */}
      <Brazier position={[0, h + 2.4, 0]} scale={0.7} intensity={5} />
    </group>
  );
}

/* --- Guard silhouette -------------------------------------------- */
function Guard({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[0.2, 0.72, 4, 8]} />
        <meshStandardMaterial color="#0d1018" roughness={1} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.17, 8, 8]} />
        <meshStandardMaterial color="#0d1018" roughness={1} />
      </mesh>
      {/* spear */}
      <mesh position={[0.28, 1.0, 0]} rotation={[0, 0, 0.06]}>
        <cylinderGeometry args={[0.035, 0.035, 2.9, 5]} />
        <meshStandardMaterial color="#161a24" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* --- A physical road, not a card --------------------------------- */
function Road({ side, active, color }) {
  const dir = side === 'left' ? -1 : 1;
  const lightRef = useRef(null);

  useFrame((_, dt) => {
    if (!lightRef.current) return;
    const target = active ? 9 : 2.2;
    lightRef.current.intensity = MathUtils.damp(lightRef.current.intensity, target, 4, dt);
  });

  // Paving slabs curving away from the fork toward the horizon.
  const slabs = useMemo(() => {
    const out = [];
    for (let i = 0; i < 16; i += 1) {
      const t = i / 15;
      const z = 8 - t * 34;
      const x = dir * (2.6 + t * t * 13);
      out.push({ x, z, s: 1 - t * 0.45, rot: dir * t * 0.42 });
    }
    return out;
  }, [dir]);

  return (
    <group>
      {slabs.map((s, i) => (
        <mesh
          key={i}
          position={[s.x, 0.02, s.z]}
          rotation={[-Math.PI / 2, 0, s.rot]}
        >
          <planeGeometry args={[5.2 * s.s, 2.4 * s.s]} />
          <meshStandardMaterial
            color={active ? '#5c688f' : '#2b3145'}
            roughness={1}
          />
        </mesh>
      ))}

      {/* road lamps */}
      <Brazier position={[dir * 5.6, 0, 3]} color={color} scale={0.8} intensity={active ? 9 : 3.4} />
      <Brazier position={[dir * 11, 0, -8]} color={color} scale={0.7} intensity={active ? 7.5 : 2.8} />
      <Brazier position={[dir * 18, 0, -19]} color={color} scale={0.6} intensity={active ? 6 : 2.2} />

      {/* wash of light down the road when hovered */}
      <pointLight
        ref={lightRef}
        position={[dir * 9, 4, -8]}
        color={color}
        intensity={2.2}
        distance={44}
        decay={2}
      />
    </group>
  );
}

/* --- Camera choreography ------------------------------------------ */
function CameraRig({ hovered, phase, chosen, travel }) {
  const { camera } = useThree();
  const state = useRef({ x: 0, y: 1.7, z: 20, lx: 0, ly: 10, lz: -30 });

  useFrame((_, dt) => {
    const s = state.current;
    let gx = 0;
    let gy = 1.7;
    let gz = 20;
    let lx = 0;
    const ly = 10;
    let lz = -30;

    // Hover bias: a few degrees toward the road, no more.
    if (phase === 'idle') {
      if (hovered === 'left') { gx = -2.2; lx = -5; }
      if (hovered === 'right') { gx = 2.2; lx = 5; }
    }

    if (phase === 'travelling') {
      const dir = chosen === 'left' ? -1 : 1;
      const t = Math.min(travel.current, 1);
      // ease-in-out so the commit feels weighted
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      gx = dir * (2.4 + e * 15);
      gz = 20 - e * 34;
      gy = 1.7 + e * 1.4;
      lx = dir * (6 + e * 16);
      lz = -30 - e * 12;
    }

    const k = phase === 'travelling' ? 3.4 : 2.4;
    s.x = MathUtils.damp(s.x, gx, k, dt);
    s.y = MathUtils.damp(s.y, gy, k, dt);
    s.z = MathUtils.damp(s.z, gz, k, dt);
    s.lx = MathUtils.damp(s.lx, lx, k, dt);
    s.lz = MathUtils.damp(s.lz, lz, k, dt);

    camera.position.set(s.x, s.y, s.z);
    camera.lookAt(s.lx, ly, s.lz);
  });

  return null;
}

function Scene({ hovered, phase, chosen, travel, quality }) {
  useFrame((_, dt) => {
    if (phase === 'travelling') travel.current += dt / (quality === 'mobile' ? 1.1 : 1.7);
  });

  // Warm courtyard gradient: hottest near the ground where the fires are,
  // falling off upward, so the opening reads as receding depth.
  const courtTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 256;
    const g = c.getContext('2d');
    const lg = g.createLinearGradient(0, 256, 0, 0);
    lg.addColorStop(0, '#fff0cf');
    lg.addColorStop(0.28, '#f7b969');
    lg.addColorStop(0.68, '#b9702c');
    lg.addColorStop(1, '#3d2412');
    g.fillStyle = lg;
    g.fillRect(0, 0, 64, 256);
    return new CanvasTexture(c);
  }, []);

  const emberCount = quality === 'mobile' ? 40 : 130;
  const embers = useMemo(
    () =>
      Array.from({ length: emberCount }).map(() => ({
        x: (Math.random() - 0.5) * 70,
        y: Math.random() * 26,
        z: -40 + Math.random() * 60,
        s: 0.4 + Math.random() * 0.5,
      })),
    [emberCount],
  );
  const emberRef = useRef(null);
  useFrame((_, dt) => {
    if (emberRef.current) emberRef.current.children.forEach((c, i) => {
      c.position.y += dt * (0.35 + (i % 5) * 0.12);
      if (c.position.y > 27) c.position.y = -1;
    });
  });

  return (
    <>
      <color attach="background" args={[NIGHT]} />
      <fog attach="fog" args={[NIGHT, 44, phase === 'travelling' ? 62 : 165]} />

      {/* Night ambient: cold and low, so firelight does the work. */}
      <ambientLight intensity={0.78} color="#4b5678" />
      <hemisphereLight args={['#5d6a99', '#0a0d18', 1.05]} />
      <directionalLight position={[-26, 40, 22]} intensity={0.95} color="#93a3d4" />
      {/* warm spill out of the gate mouth */}
      <pointLight position={[0, 6, -25]} color={GOLD} intensity={40} distance={90} decay={1.7} />
      {/* moonlight rim so the wall silhouette separates from the sky */}
      <directionalLight position={[18, 26, 34]} intensity={0.5} color="#aab8e0" />

      {/* ---- ground ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#1b2030" roughness={1} />
      </mesh>

      {/* ---- fortress wall ----
          Built as two segments plus a lintel so the gate is a REAL
          aperture. A filled box with a black rectangle in front of it
          reads as a painted-on door and kills the light spill. */}
      {[-1, 1].map((d) => {
        const segW = 38 - GATE_W / 2;
        return (
          <mesh key={d} position={[d * (GATE_W / 2 + segW / 2), WALL_H / 2, -30]}>
            <boxGeometry args={[segW, WALL_H, 3]} />
            <meshStandardMaterial color="#39415c" roughness={0.95} />
          </mesh>
        );
      })}
      {/* lintel spanning above the opening */}
      <mesh position={[0, GATE_H + (WALL_H - GATE_H) / 2, -30]}>
        <boxGeometry args={[GATE_W, WALL_H - GATE_H, 3]} />
        <meshStandardMaterial color="#39415c" roughness={0.95} />
      </mesh>

      {/* crenellations */}
      {Array.from({ length: 26 }).map((_, i) => (
        <mesh key={i} position={[-72 / 2 + i * 3 + 1.5, WALL_H + 0.9, -30]}>
          <boxGeometry args={[1.7, 1.8, 3.2]} />
          <meshStandardMaterial color="#2f3650" roughness={0.95} />
        </mesh>
      ))}

      {/* gate tunnel walls, catching the warm interior light */}
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * (GATE_W / 2), GATE_H / 2, -32]} rotation={[0, d * Math.PI / 2, 0]}>
          <planeGeometry args={[7, GATE_H]} />
          <meshStandardMaterial color="#6b4a26" roughness={0.9} side={2} />
        </mesh>
      ))}

      {/* the lit courtyard seen through the opening -- gradient, so it
          reads as depth receding into light rather than a lit panel */}
      <mesh position={[0, GATE_H / 2, -35.4]}>
        <planeGeometry args={[GATE_W, GATE_H]} />
        <meshBasicMaterial map={courtTex} toneMapped={false} />
      </mesh>
      {/* silhouettes moving inside: an active kingdom beyond the gate */}
      <Guard position={[-1.9, 0, -34]} rotation={0.5} />
      <Guard position={[2.1, 0, -33.2]} rotation={-0.4} />

      {/* gate frame pilasters */}
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * (GATE_W / 2 + 1.2), GATE_H / 2 + 1, -29.2]}>
          <boxGeometry args={[2.2, GATE_H + 3, 3.4]} />
          <meshStandardMaterial color="#454e6e" roughness={0.92} />
        </mesh>
      ))}

      {/* K710 crest keystone above the gate */}
      <mesh position={[0, GATE_H + 3.6, -28.6]}>
        <cylinderGeometry args={[2.1, 2.1, 0.5, 6]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.5}
          metalness={0.85}
          roughness={0.32}
        />
      </mesh>

      {/* ---- towers ---- */}
      <Tower x={-17} />
      <Tower x={17} />
      <Tower x={-40} z={-33} h={WALL_H + 3} r={3.4} />
      <Tower x={40} z={-33} h={WALL_H + 3} r={3.4} />

      {/* ---- three warband banners on the wall ---- */}
      <Banner position={[-11, WALL_H - 1.2, -28.2]} color="#c9963c" height={8.5} width={2.4} />
      <Banner position={[0, WALL_H - 0.2, -28.2]} color="#a3283c" height={9.5} width={2.6} />
      <Banner position={[11, WALL_H - 1.2, -28.2]} color="#3f74bd" height={8.5} width={2.4} />

      {/* ---- guards at the gate ---- */}
      <Guard position={[-6.4, 0, -26]} rotation={0.2} />
      <Guard position={[6.4, 0, -26]} rotation={-0.2} />

      {/* ---- mountain silhouettes behind the fortress ---- */}
      {[[-62, -80, 30], [-32, -92, 40], [6, -100, 46], [44, -88, 36], [76, -78, 28]].map((m, i) => (
        <mesh key={i} position={[m[0], m[2] / 2 - 3, m[1]]}>
          <coneGeometry args={[m[2] * 0.95, m[2], 4]} />
          <meshBasicMaterial color="#141a2c" />
        </mesh>
      ))}

      {/* ---- the two roads ---- */}
      <Road side="left" active={hovered === 'left'} color={GOLD} />
      <Road side="right" active={hovered === 'right'} color={SKY_BLUE} />

      {/* approach braziers flanking the fork */}
      <Brazier position={[-6.5, 0, 12]} color={FIRE} scale={1.15} intensity={9} />
      <Brazier position={[6.5, 0, 12]} color={FIRE} scale={1.15} intensity={9} />

      {/* ---- drifting embers ---- */}
      <group ref={emberRef}>
        {embers.map((e, i) => (
          <mesh key={i} position={[e.x, e.y, e.z]}>
            <sphereGeometry args={[0.05 * e.s, 5, 5]} />
            <meshBasicMaterial color={FIRE} transparent opacity={0.75} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <CameraRig hovered={hovered} phase={phase} chosen={chosen} travel={travel} />
    </>
  );
}

export default function GateScene({ hovered, phase, chosen, quality = 'standard' }) {
  const travel = useRef(0);
  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return quality === 'mobile'
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : Math.min(window.devicePixelRatio || 1, 1.75);
  }, [quality]);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: quality !== 'mobile', powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 48, position: [0, 1.7, 20], near: 0.1, far: 600 }}
      shadows={false}
    >
      <Scene hovered={hovered} phase={phase} chosen={chosen} travel={travel} quality={quality} />
    </Canvas>
  );
}
