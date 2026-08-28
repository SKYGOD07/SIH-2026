'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier } from '@/hooks/useDeviceTier';

/**
 * The hero object — rebuilt.
 *
 * The first version scattered ~100 small metallic shards, which read as debris
 * rather than as a considered object. The reference language is the opposite:
 * a handful of LARGE, soft, matte forms that intersect the typography, lit like
 * porcelain on a bright ground.
 *
 * So: six forms, no more. Each is a primitive with heavy rounding and a
 * high-roughness / zero-metalness material — the clay look comes almost entirely
 * from roughness plus a soft key light, not from environment reflections.
 *
 * Scroll drives one continuous motion: the forms begin dispersed and slightly
 * tumbled (the problem, unresolved), and converge into an ordered column (the
 * system). Nothing fades; everything moves.
 */

type FormKind = 'box' | 'capsule' | 'torus' | 'sphere' | 'cylinder';

interface Form {
  kind: FormKind;
  /** Dispersed position — the unresolved state. */
  from: [number, number, number];
  /** Assembled position — the ordered state. */
  to: [number, number, number];
  scale: number;
  /** Tumble in the dispersed state; resolves toward zero. */
  tilt: [number, number, number];
  /** Idle rotation speed. Deliberately slow. */
  spin: number;
  tone: string;
}

/**
 * Six forms, composed rather than randomised. Positions are hand-placed so the
 * group reads as an arrangement — a seeded random cloud is what produced the
 * debris look the first time.
 */
const FORMS: Form[] = [
  {
    kind: 'box',
    from: [-3.4, 1.9, -1.2],
    to: [-1.5, 1.7, 0.4],
    scale: 1.5,
    tilt: [0.5, 0.7, -0.3],
    spin: 0.055,
    tone: '#EFE9DF',
  },
  {
    kind: 'capsule',
    from: [3.9, 1.1, -2.6],
    to: [1.6, 0.9, -0.3],
    scale: 1.15,
    tilt: [-0.8, 0.2, 0.9],
    spin: -0.04,
    tone: '#E4DCCF',
  },
  {
    kind: 'torus',
    from: [-2.6, -1.9, -3.4],
    to: [-0.9, -1.2, -0.8],
    scale: 1.3,
    tilt: [1.1, -0.4, 0.2],
    spin: 0.07,
    tone: '#F2ECE2',
  },
  {
    kind: 'sphere',
    from: [2.4, -2.3, -0.6],
    to: [1.1, -1.7, 0.9],
    scale: 0.95,
    tilt: [0, 0, 0],
    spin: 0.03,
    tone: '#E8DFD0',
  },
  {
    kind: 'cylinder',
    from: [0.4, 3.1, -4.2],
    to: [0.2, 2.6, -1.4],
    scale: 1.0,
    tilt: [0.9, 0.5, -0.6],
    spin: -0.05,
    tone: '#EDE6DA',
  },
  {
    // The one accent form. A single warm object against five neutrals.
    kind: 'box',
    from: [1.2, -0.2, 1.8],
    to: [0.1, 0.1, 1.6],
    scale: 0.72,
    tilt: [-0.4, 0.8, 0.35],
    spin: 0.09,
    tone: '#D2590F',
  },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Geometry({ kind }: { kind: FormKind }) {
  switch (kind) {
    case 'capsule':
      return <capsuleGeometry args={[0.55, 1.1, 8, 24]} />;
    case 'torus':
      return <torusGeometry args={[0.8, 0.32, 20, 48]} />;
    case 'sphere':
      return <sphereGeometry args={[0.85, 40, 32]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.62, 0.62, 1.3, 36]} />;
    default:
      return null;
  }
}

function SoftForm({ form, progress }: { form: Form; progress: ProgressRef }) {
  const ref = useRef<THREE.Group>(null);
  const eased = useRef(0);
  const from = useMemo(() => new THREE.Vector3(...form.from), [form.from]);
  const to = useMemo(() => new THREE.Vector3(...form.to), [form.to]);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const step = Math.min(dt, 0.05);
    eased.current = damp(eased.current, ease(progress.current), 3.4, step);
    const p = eased.current;
    const t = state.clock.elapsedTime;

    g.position.lerpVectors(from, to, p);
    // A slow float keeps the assembled state alive without adding noise.
    g.position.y += Math.sin(t * 0.42 + form.from[0]) * 0.09 * (1 - p * 0.55);

    // Tumble resolves into alignment as the system forms.
    g.rotation.x = form.tilt[0] * (1 - p) + t * form.spin * 0.35;
    g.rotation.y = form.tilt[1] * (1 - p) + t * form.spin;
    g.rotation.z = form.tilt[2] * (1 - p);

    const s = form.scale * (1 + p * 0.12);
    g.scale.setScalar(s);
  });

  const material = (
    <meshStandardMaterial
      color={form.tone}
      // Matte porcelain: roughness does the work, no metalness, no reflections.
      roughness={0.88}
      metalness={0}
      envMapIntensity={0.25}
    />
  );

  return (
    <group ref={ref}>
      {form.kind === 'box' ? (
        <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.34} smoothness={5}>
          {material}
        </RoundedBox>
      ) : (
        <mesh>
          <Geometry kind={form.kind} />
          {material}
        </mesh>
      )}
    </group>
  );
}

/**
 * Lighting rig for the matte look: one broad soft key from above-front, a cool
 * fill to keep the shadow side from going muddy, and a warm bounce. No
 * environment map — reflections are exactly what this material should not have.
 */
function SoftLight() {
  return (
    <>
      <ambientLight intensity={1.5} color="#FBF7F0" />
      <directionalLight position={[3, 6, 5]} intensity={2.2} color="#FFFDF8" />
      <directionalLight position={[-5, 1, 2]} intensity={0.7} color="#C9D4DE" />
      <directionalLight position={[0, -4, 3]} intensity={0.45} color="#E8C9A8" />
    </>
  );
}

function Rig({ progress }: { progress: ProgressRef }) {
  const group = useRef<THREE.Group>(null);
  const { tier } = useDeviceTier();
  const reach = tier === 'mobile' ? 0.3 : 1;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = ease(progress.current);
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);

    g.rotation.y = Math.sin(t * 0.09) * 0.12 * reach + p * 0.35;

    // The camera barely moves. Scale and arrangement carry the sequence.
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 11 - p * 1.6, 2, step);
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      Math.sin(t * 0.13) * 0.18 * reach,
      2,
      step,
    );
    state.camera.lookAt(0, 0, 0);
  });

  // Mobile drops the two furthest forms — they are the least legible and the
  // first to cost frames.
  const forms = tier === 'mobile' ? FORMS.slice(0, 4) : FORMS;

  return (
    <group ref={group}>
      {forms.map((form, i) => (
        <SoftForm key={i} form={form} progress={progress} />
      ))}
    </group>
  );
}

export default function ProblemForms({ progress }: { progress: ProgressRef }) {
  return (
    <>
      <SoftLight />
      <Rig progress={progress} />
    </>
  );
}
