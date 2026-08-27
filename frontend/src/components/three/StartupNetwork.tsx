'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded, clamp } from '@/lib/utils';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier, scaleCount } from '@/hooks/useDeviceTier';
import { DISCOVERY_FUNNEL } from '@/data/startups';
import { Studio, SCENE_COLORS } from './Studio';

/**
 * The discovery field: thousands of candidate startups, filtered down to three
 * in visible passes.
 *
 * The filtering is deliberately not instantaneous. Every point carries a rank;
 * as the scroll advances, the acceptance threshold rises and the points that
 * fall below it drift out and fade, while survivors converge. The reader can
 * watch the population shrink, which is the whole point — a shortlist that
 * simply appears is exactly the opaque behaviour this platform argues against.
 */

const STAGES = DISCOVERY_FUNNEL.length; // 5

interface Field {
  home: Float32Array;
  exit: Float32Array;
  focus: Float32Array;
  rank: Float32Array;
  seedPhase: Float32Array;
}

function buildField(count: number, finalists: number): Field {
  const rand = seeded(311);
  const home = new Float32Array(count * 3);
  const exit = new Float32Array(count * 3);
  const focus = new Float32Array(count * 3);
  const rank = new Float32Array(count);
  const seedPhase = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // A wide slab rather than a sphere: reads as a population, not an object.
    const r = 4 + Math.pow(rand(), 0.6) * 9;
    const a = rand() * Math.PI * 2;
    home[i3] = Math.cos(a) * r * 1.35;
    home[i3 + 1] = (rand() - 0.5) * 9;
    home[i3 + 2] = Math.sin(a) * r * 0.75 - 4;

    // Rejected points leave outward and back, never through the camera.
    exit[i3] = home[i3] * 2.2;
    exit[i3 + 1] = home[i3 + 1] * 1.6 + (rand() - 0.5) * 6;
    exit[i3 + 2] = home[i3 + 2] * 1.4 - 10;

    if (i < finalists) {
      // The three finalists take deliberate, legible positions across the frame.
      const spread = (i - (finalists - 1) / 2) * 3.2;
      focus[i3] = spread;
      focus[i3 + 1] = i % 2 === 0 ? 0.4 : -0.5;
      focus[i3 + 2] = 1.5;
      rank[i] = 1;
    } else {
      focus[i3] = home[i3] * 0.28;
      focus[i3 + 1] = home[i3 + 1] * 0.28;
      focus[i3 + 2] = home[i3 + 2] * 0.28 + 1;
      // Rank decides survival order; finalists are pinned at the top.
      rank[i] = rand();
    }

    seedPhase[i] = rand() * Math.PI * 2;
  }

  return { home, exit, focus, rank, seedPhase };
}

/** Survival threshold at a given scroll progress, from the real funnel counts. */
function thresholdAt(progress: number): number {
  const step = clamp(progress * (STAGES - 1), 0, STAGES - 1);
  const i = Math.floor(step);
  const f = step - i;
  const a = DISCOVERY_FUNNEL[i].count;
  const b = DISCOVERY_FUNNEL[Math.min(i + 1, STAGES - 1)].count;
  const surviving = THREE.MathUtils.lerp(a, b, f);
  // Points are ranked 0..1; keep the top `surviving / population` fraction.
  return 1 - clamp(surviving / DISCOVERY_FUNNEL[0].count, 0, 1);
}

function Field({ progress, count, finalists }: { progress: ProgressRef; count: number; finalists: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const field = useMemo(() => buildField(count, finalists), [count, finalists]);
  const eased = useRef(0);

  const accent = useMemo(() => new THREE.Color(SCENE_COLORS.saffron), []);
  const neutral = useMemo(() => new THREE.Color(SCENE_COLORS.silver), []);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const step = Math.min(dt, 0.05);
    eased.current = damp(eased.current, progress.current, 3.2, step);
    const p = eased.current;
    const t = state.clock.elapsedTime;
    const cut = thresholdAt(p);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const survives = field.rank[i] >= cut;
      const isFinalist = i < finalists;

      // How far this point has travelled toward its fate, 0..1.
      const fate = survives ? clamp(p, 0, 1) : clamp((cut - field.rank[i]) * 6, 0, 1);

      const target = survives ? field.focus : field.exit;
      const drift = Math.sin(t * 0.4 + field.seedPhase[i]) * 0.12 * (1 - fate);

      dummy.position.set(
        THREE.MathUtils.lerp(field.home[i3], target[i3], fate),
        THREE.MathUtils.lerp(field.home[i3 + 1], target[i3 + 1], fate) + drift,
        THREE.MathUtils.lerp(field.home[i3 + 2], target[i3 + 2], fate),
      );

      let s: number;
      if (!survives) {
        s = 0.055 * (1 - fate);
      } else if (isFinalist) {
        // Finalists grow into readable nodes only at the end of the sequence.
        s = 0.055 + Math.max(0, p - 0.62) * 1.05;
      } else {
        s = 0.055 + p * 0.02;
      }
      dummy.scale.setScalar(Math.max(s, 0.0001));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.copy(isFinalist ? accent : neutral);
      if (!isFinalist && survives) color.lerp(accent, p * 0.4);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.34}
        metalness={0.55}
        emissive={SCENE_COLORS.saffron}
        emissiveIntensity={0.12}
        toneMapped
      />
    </instancedMesh>
  );
}

function CameraDrift({ progress }: { progress: ProgressRef }) {
  useFrame((state, dt) => {
    const p = progress.current;
    const step = Math.min(dt, 0.05);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 16 - p * 6.5, 2.2, step);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, p * 0.8, 2, step);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function StartupNetwork({ progress }: { progress: ProgressRef }) {
  const device = useDeviceTier();
  // 2,481 is the headline figure; the rendered population is scaled to the
  // device and the copy states the real number.
  const count = scaleCount(device.tier === 'desktop' ? 2481 : 1400, device);
  return (
    <>
      <Studio intensity={0.9} />
      <Field progress={progress} count={count} finalists={3} />
      <CameraDrift progress={progress} />
    </>
  );
}
