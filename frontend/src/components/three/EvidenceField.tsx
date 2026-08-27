'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded, clamp } from '@/lib/utils';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier, scaleCount } from '@/hooks/useDeviceTier';
import { Studio, SCENE_COLORS } from './Studio';

/**
 * The retrieval scene: a corpus of policy documents drawn through a central
 * mechanism, from which three cited sources emerge.
 *
 * The choreography is the argument. Documents exist first, independently of any
 * question; the mechanism draws from them; the answer comes out carrying its
 * sources. Nothing is generated from nowhere.
 */

const RETRIEVED = 3;

function Documents({ progress, count }: { progress: ProgressRef; count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const ivory = useMemo(() => new THREE.Color(SCENE_COLORS.ivory), []);
  const accent = useMemo(() => new THREE.Color(SCENE_COLORS.saffronLight), []);
  const eased = useRef(0);

  const layout = useMemo(() => {
    const rand = seeded(613);
    const shelf = new Float32Array(count * 3);
    const spin = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // A loose archive: two shallow banks either side of the mechanism.
      const side = i % 2 === 0 ? -1 : 1;
      shelf[i3] = side * (2.6 + rand() * 5.5);
      shelf[i3 + 1] = (rand() - 0.5) * 7.5;
      shelf[i3 + 2] = (rand() - 0.5) * 7 - 1;
      spin[i3] = (rand() - 0.5) * 0.7;
      spin[i3 + 1] = side * (0.4 + rand() * 0.5);
      spin[i3 + 2] = (rand() - 0.5) * 0.4;
      phase[i] = rand() * Math.PI * 2;
    }
    return { shelf, spin, phase };
  }, [count]);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const step = Math.min(dt, 0.05);
    eased.current = damp(eased.current, progress.current, 3, step);
    const p = eased.current;
    const t = state.clock.elapsedTime;

    // Phase 1 (0-0.45): documents drift toward the mechanism.
    // Phase 2 (0.45-1): the three cited sources come forward, the rest recede.
    const pull = clamp(p / 0.45, 0, 1);
    const emit = clamp((p - 0.45) / 0.55, 0, 1);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const cited = i < RETRIEVED;

      const drift = Math.sin(t * 0.45 + layout.phase[i]) * 0.22;

      // Everything converges on the mechanism first.
      const cx = THREE.MathUtils.lerp(layout.shelf[i3], 0, pull * (cited ? 1 : 0.72));
      const cy = THREE.MathUtils.lerp(layout.shelf[i3 + 1], 0, pull * (cited ? 1 : 0.72)) + drift * (1 - pull * 0.6);
      const cz = THREE.MathUtils.lerp(layout.shelf[i3 + 2], 0, pull * (cited ? 1 : 0.72));

      if (cited) {
        // Cited sources are placed, evenly and legibly, in front of the mechanism.
        const slot = (i - (RETRIEVED - 1) / 2) * 2.9;
        dummy.position.set(
          THREE.MathUtils.lerp(cx, slot, emit),
          THREE.MathUtils.lerp(cy, 0.2, emit),
          THREE.MathUtils.lerp(cz, 3.4, emit),
        );
        dummy.rotation.set(
          THREE.MathUtils.lerp(layout.spin[i3] + t * 0.1, 0, emit),
          THREE.MathUtils.lerp(layout.spin[i3 + 1] + t * 0.15, 0, emit),
          THREE.MathUtils.lerp(layout.spin[i3 + 2], 0, emit),
        );
        const s = 1 + emit * 0.85;
        dummy.scale.set(s, s, 1);
        color.copy(ivory).lerp(accent, emit * 0.55);
      } else {
        // The rest of the corpus stays present but recedes — it did not vanish,
        // it simply was not relevant to this question.
        dummy.position.set(
          THREE.MathUtils.lerp(cx, cx * 1.35, emit),
          THREE.MathUtils.lerp(cy, cy * 1.2, emit),
          THREE.MathUtils.lerp(cz, cz - 5, emit),
        );
        dummy.rotation.set(
          layout.spin[i3] + t * 0.08,
          layout.spin[i3 + 1] + t * 0.12,
          layout.spin[i3 + 2],
        );
        const s = 1 - emit * 0.35;
        dummy.scale.set(s, s, 1);
        color.copy(ivory).multiplyScalar(1 - emit * 0.55);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.72, 0.96]} />
      <meshStandardMaterial
        roughness={0.7}
        metalness={0.04}
        side={THREE.DoubleSide}
        transparent
        opacity={0.92}
      />
    </instancedMesh>
  );
}

/** The retrieval mechanism: a glass lens ring, not a brain and not a chatbot. */
function RetrievalCore({ progress }: { progress: ProgressRef }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = progress.current;
    g.rotation.z = t * 0.18;
    g.rotation.x = Math.sin(t * 0.25) * 0.14;
    const s = 1 + Math.sin(t * 0.9) * 0.015;
    g.scale.setScalar(s * (1 - clamp((p - 0.45) / 0.55, 0, 1) * 0.25));
    if (inner.current) {
      const m = inner.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = THREE.MathUtils.damp(
        m.emissiveIntensity,
        0.25 + Math.sin(t * 2.2) * 0.08 + p * 0.5,
        3,
        Math.min(dt, 0.05),
      );
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <torusGeometry args={[1.6, 0.055, 12, 96]} />
        <meshPhysicalMaterial
          color={SCENE_COLORS.ivory}
          roughness={0.15}
          metalness={0.85}
          transmission={0.2}
          thickness={0.5}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.03, 10, 72]} />
        <meshStandardMaterial color={SCENE_COLORS.silver} roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.42, 2]} />
        <meshStandardMaterial
          color={SCENE_COLORS.saffron}
          emissive={SCENE_COLORS.saffron}
          emissiveIntensity={0.3}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

export default function EvidenceField({ progress }: { progress: ProgressRef }) {
  const device = useDeviceTier();
  const count = Math.max(RETRIEVED + 6, scaleCount(46, device));

  return (
    <>
      <Studio intensity={0.95} />
      <Documents progress={progress} count={count} />
      <RetrievalCore progress={progress} />
    </>
  );
}
