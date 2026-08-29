'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier } from '@/hooks/useDeviceTier';

/**
 * The forms that travel the whole page.
 *
 * Previously each section owned its own WebGL canvas, so the objects appeared,
 * disappeared, and reappeared as unrelated props. This is one cast of six
 * matte forms that exists for the entire document and is choreographed against
 * global scroll — they drift, gather, recede and reassemble as the argument
 * moves, which is what makes the page feel like one continuous space.
 *
 * Each form carries a waypoint track keyed to global scroll progress (0 at the
 * top of the document, 1 at the bottom). Between waypoints the position is
 * smoothstep-interpolated, then damped, so scroll direction changes never
 * snap.
 */

type FormKind = 'box' | 'capsule' | 'torus' | 'sphere' | 'cylinder';

interface Waypoint {
  /** Global scroll progress this waypoint applies at. */
  p: number;
  x: number;
  y: number;
  z: number;
  /** Scale multiplier against the form's base size. */
  s: number;
}

interface Form {
  kind: FormKind;
  base: number;
  tone: string;
  spin: number;
  track: Waypoint[];
}

/*
 * The journey, in six acts:
 *   0.00 hero        forms cluster right of the headline
 *   0.16 problem     they separate and recede — background, not subject
 *   0.34 pathway     they line up, echoing the ten stages
 *   0.52 simulator   they gather tight: the system forming
 *   0.70 evidence    forward and large against the dark ground
 *   0.86 outcome     spread wide and low
 *   1.00 finale      converge to centre and withdraw into depth
 */
const FORMS: Form[] = [
  {
    kind: 'box',
    base: 1.25,
    tone: '#F2F2F2',
    spin: 0.055,
    track: [
      { p: 0.0, x: 0.6, y: 1.9, z: 0.2, s: 1 },
      { p: 0.16, x: -3.2, y: 1.2, z: -3.5, s: 0.9 },
      { p: 0.34, x: 3.4, y: 2.2, z: -2.2, s: 0.85 },
      { p: 0.52, x: 1.2, y: 1.4, z: 0.6, s: 1.05 },
      { p: 0.7, x: -1.8, y: 0.9, z: 1.4, s: 1.25 },
      { p: 0.86, x: -4.2, y: -1.6, z: -1.2, s: 1 },
      { p: 1.0, x: 0, y: 0.4, z: -7, s: 0.7 },
    ],
  },
  {
    kind: 'capsule',
    base: 1.05,
    tone: '#D8D8D8',
    spin: -0.04,
    track: [
      { p: 0.0, x: 3.1, y: 0.8, z: -0.3, s: 1 },
      { p: 0.16, x: 4.6, y: -0.4, z: -4.2, s: 0.85 },
      { p: 0.34, x: -3.8, y: 0.6, z: -1.8, s: 0.9 },
      { p: 0.52, x: -1.4, y: 1.9, z: 0.4, s: 1 },
      { p: 0.7, x: 1.9, y: -0.6, z: 1.1, s: 1.2 },
      { p: 0.86, x: 4.4, y: -1.2, z: -0.8, s: 1 },
      { p: 1.0, x: 0, y: -0.3, z: -7.6, s: 0.7 },
    ],
  },
  {
    kind: 'torus',
    base: 1.05,
    tone: '#FFFFFF',
    spin: 0.07,
    track: [
      { p: 0.0, x: 0.4, y: -1.5, z: -0.9, s: 1 },
      { p: 0.16, x: -4.4, y: -2.1, z: -3.0, s: 0.9 },
      { p: 0.34, x: 1.6, y: -2.4, z: -1.4, s: 0.95 },
      { p: 0.52, x: -0.4, y: -1.1, z: 0.9, s: 1.1 },
      { p: 0.7, x: 2.6, y: 1.6, z: 0.6, s: 1.3 },
      { p: 0.86, x: -2.2, y: 2.1, z: -1.6, s: 1 },
      { p: 1.0, x: 0, y: 0, z: -6.4, s: 0.7 },
    ],
  },
  {
    kind: 'sphere',
    base: 0.9,
    tone: '#CFCFCF',
    spin: 0.03,
    track: [
      { p: 0.0, x: 2.5, y: -1.8, z: 0.7, s: 1 },
      { p: 0.16, x: 3.9, y: 1.9, z: -2.6, s: 0.9 },
      { p: 0.34, x: -1.9, y: -2.2, z: -2.8, s: 0.9 },
      { p: 0.52, x: 2.1, y: -1.7, z: 0.2, s: 1.05 },
      { p: 0.7, x: -3.1, y: -1.4, z: 0.9, s: 1.25 },
      { p: 0.86, x: 1.4, y: 2.4, z: -1.4, s: 1 },
      { p: 1.0, x: 0, y: -0.6, z: -8.2, s: 0.7 },
    ],
  },
  {
    kind: 'cylinder',
    base: 0.85,
    tone: '#E6E6E6',
    spin: -0.05,
    track: [
      { p: 0.0, x: 1.9, y: 2.5, z: -1.5, s: 1 },
      { p: 0.16, x: -2.6, y: 2.6, z: -4.6, s: 0.85 },
      { p: 0.34, x: 4.0, y: -1.4, z: -2.4, s: 0.9 },
      { p: 0.52, x: -2.4, y: -0.4, z: 0.1, s: 1.05 },
      { p: 0.7, x: 0.4, y: 2.2, z: 1.2, s: 1.2 },
      { p: 0.86, x: -0.9, y: -2.6, z: -1.0, s: 1 },
      { p: 1.0, x: 0, y: 0.8, z: -7, s: 0.7 },
    ],
  },
  {
    // The one accent form. A single hot object against five neutrals, in the
    // deck's red — a yellow one reads as a second accent competing with it.
    kind: 'box',
    base: 0.66,
    tone: '#BD0A0A',
    spin: 0.09,
    track: [
      { p: 0.0, x: 1.9, y: 0.0, z: 1.4, s: 1 },
      { p: 0.16, x: 0.4, y: -2.6, z: -1.8, s: 0.9 },
      { p: 0.34, x: -0.6, y: 1.6, z: 0.6, s: 1 },
      { p: 0.52, x: 0.2, y: 0.2, z: 1.9, s: 1.35 },
      { p: 0.7, x: 0.6, y: -1.9, z: 1.8, s: 1.4 },
      { p: 0.86, x: 2.6, y: 0.9, z: 1.1, s: 1.15 },
      { p: 1.0, x: 0, y: 0, z: -4.6, s: 0.9 },
    ],
  },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Interpolate a track at global progress `p`. */
function sample(track: Waypoint[], p: number, out: THREE.Vector4): THREE.Vector4 {
  if (p <= track[0].p) {
    const w = track[0];
    return out.set(w.x, w.y, w.z, w.s);
  }
  const last = track[track.length - 1];
  if (p >= last.p) return out.set(last.x, last.y, last.z, last.s);

  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = smooth((p - a.p) / (b.p - a.p));
      return out.set(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t,
        a.s + (b.s - a.s) * t,
      );
    }
  }
  return out.set(last.x, last.y, last.z, last.s);
}

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

function TravellingForm({ form, progress }: { form: Form; progress: ProgressRef }) {
  const ref = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector4(), []);
  const current = useRef(new THREE.Vector4(form.track[0].x, form.track[0].y, form.track[0].z, form.track[0].s));

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const step = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;

    sample(form.track, progress.current, target);

    // Damped follow, so a fast scroll or a direction change never snaps.
    current.current.x = damp(current.current.x, target.x, 3, step);
    current.current.y = damp(current.current.y, target.y, 3, step);
    current.current.z = damp(current.current.z, target.z, 3, step);
    current.current.w = damp(current.current.w, target.w, 3, step);

    // A slow idle float keeps the forms alive when the reader stops scrolling.
    g.position.set(
      current.current.x,
      current.current.y + Math.sin(t * 0.4 + form.track[0].x) * 0.1,
      current.current.z,
    );
    g.rotation.x = t * form.spin * 0.35;
    g.rotation.y = t * form.spin;
    g.scale.setScalar(form.base * current.current.w);
  });

  const material = (
    <meshStandardMaterial
      color={form.tone}
      // Matte porcelain: roughness does the work, no reflections.
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
 * Lighting for the matte look: a broad soft key, a cool fill so the shadow side
 * does not go muddy, and a warm bounce. No environment map — reflections are
 * exactly what this material should not have.
 */
function SoftLight() {
  return (
    <>
      <ambientLight intensity={0.55} color="#FFFFFF" />
      <directionalLight position={[3, 6, 5]} intensity={2.6} color="#FFFFFF" />
      <directionalLight position={[-5, 1, 2]} intensity={0.7} color="#7A8390" />
      <directionalLight position={[0, -4, 3]} intensity={0.45} color="#BD0A0A" />
    </>
  );
}

function Camera({ progress }: { progress: ProgressRef }) {
  useFrame((state, dt) => {
    const p = progress.current;
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);

    // A single slow dolly across the whole document, plus a barely-there drift.
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 11 - p * 1.4, 1.6, step);
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      Math.sin(t * 0.12) * 0.16,
      1.6,
      step,
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function JourneyForms({ progress }: { progress: ProgressRef }) {
  const { tier } = useDeviceTier();
  // Mobile drops the two smallest forms: least legible, first to cost frames.
  const forms = tier === 'mobile' ? FORMS.slice(0, 4) : FORMS;

  return (
    <>
      <SoftLight />
      {forms.map((form, i) => (
        <TravellingForm key={i} form={form} progress={progress} />
      ))}
      <Camera progress={progress} />
    </>
  );
}
