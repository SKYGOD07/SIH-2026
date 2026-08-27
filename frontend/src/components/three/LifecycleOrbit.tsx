'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp } from '@/lib/utils';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { LIFECYCLE } from '@/data/lifecycle';
import { Studio, SCENE_COLORS } from './Studio';

/**
 * The lifecycle mechanism — the central object of the whole site.
 *
 * Eight stages on a tilted orbit around a core. Scroll drives which stage is
 * forward: the active node advances toward the camera and lights, the previous
 * one recedes, the connecting arc between them energises, and the core changes
 * state. The orbit is the product, drawn as one machine rather than eight cards.
 */

const COUNT = LIFECYCLE.length;
const RADIUS = 3.4;
const TILT = 0.42;

function stageAngle(i: number): number {
  // Stage 01 sits at the front; the sequence runs clockwise from there.
  return -(i / COUNT) * Math.PI * 2 + Math.PI / 2;
}

function stagePosition(i: number, target = new THREE.Vector3()): THREE.Vector3 {
  const a = stageAngle(i);
  return target.set(Math.cos(a) * RADIUS, Math.sin(a) * RADIUS * TILT, Math.sin(a) * RADIUS * 0.55);
}

/** Distance from the active index, wrapped around the ring. */
function ringDistance(i: number, active: number): number {
  const d = Math.abs(i - active);
  return Math.min(d, COUNT - d);
}

function StageNodes({ progress }: { progress: ProgressRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const idle = useMemo(() => new THREE.Color(SCENE_COLORS.silver), []);
  const live = useMemo(() => new THREE.Color(SCENE_COLORS.saffron), []);
  const done = useMemo(() => new THREE.Color(SCENE_COLORS.validated), []);
  const eased = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const step = Math.min(dt, 0.05);
    eased.current = damp(eased.current, progress.current, 4, step);
    const p = eased.current;
    const t = state.clock.elapsedTime;
    const head = p * (COUNT - 1);

    for (let i = 0; i < COUNT; i++) {
      stagePosition(i, vec);
      const dist = ringDistance(i, head);
      const focus = clamp(1 - dist / 1.6, 0, 1); // 1 at the active stage
      const past = i < head;

      // Active stage comes forward; everything else sits back on the ring.
      dummy.position.set(vec.x, vec.y, vec.z + focus * 1.5);
      const pulse = 1 + Math.sin(t * 1.4 + i) * 0.03 * focus;
      dummy.scale.setScalar((0.16 + focus * 0.2) * pulse);
      dummy.rotation.set(t * 0.2, t * 0.3 + i, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.copy(past ? done : idle).lerp(live, focus);
      // Stages still ahead read as dim, so the sequence has a direction.
      if (!past && focus < 0.1) color.multiplyScalar(0.55);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        roughness={0.24}
        metalness={0.72}
        emissive={SCENE_COLORS.saffron}
        emissiveIntensity={0.22}
      />
    </instancedMesh>
  );
}

/**
 * The path between stages — dim as a whole, bright where the process has run.
 *
 * Built as THREE.Line objects and mounted through `<primitive>` rather than the
 * `<line>` intrinsic, whose JSX name collides with SVG's and types badly.
 */
function OrbitPath({ progress }: { progress: ProgressRef }) {
  const { base, active, activeGeometry } = useMemo(() => {
    const baseGeometry = buildRing(1);
    const activeGeo = buildRing(1);
    return {
      base: new THREE.Line(
        baseGeometry,
        new THREE.LineBasicMaterial({
          color: SCENE_COLORS.silver,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        }),
      ),
      active: new THREE.Line(
        activeGeo,
        new THREE.LineBasicMaterial({
          color: SCENE_COLORS.saffron,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      ),
      activeGeometry: activeGeo,
    };
  }, []);

  useEffect(
    () => () => {
      base.geometry.dispose();
      (base.material as THREE.Material).dispose();
      active.geometry.dispose();
      (active.material as THREE.Material).dispose();
    },
    [base, active],
  );

  useFrame(() => {
    // drawRange turns the arc into a progress trace around the ring.
    const total = activeGeometry.getAttribute('position').count;
    activeGeometry.setDrawRange(0, Math.max(2, Math.floor(total * clamp(progress.current, 0, 1))));
  });

  return (
    <group>
      <primitive object={base} />
      <primitive object={active} />
    </group>
  );
}

function buildRing(scale: number): THREE.BufferGeometry {
  const points: number[] = [];
  const segments = 320;
  for (let i = 0; i <= segments; i++) {
    const a = stageAngle((i / segments) * COUNT);
    points.push(
      Math.cos(a) * RADIUS * scale,
      Math.sin(a) * RADIUS * TILT * scale,
      Math.sin(a) * RADIUS * 0.55 * scale,
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

/** The core: a glass mass that tightens as the pathway completes. */
function Core({ progress }: { progress: ProgressRef }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const p = progress.current;
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.12;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
      const s = THREE.MathUtils.damp(meshRef.current.scale.x, 0.85 + p * 0.32, 2.5, step);
      meshRef.current.scale.setScalar(s);
    }
    if (shellRef.current) {
      shellRef.current.rotation.y = -t * 0.07;
      const m = shellRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = THREE.MathUtils.damp(m.opacity, 0.1 + p * 0.16, 2, step);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.9, 3]} />
        <meshPhysicalMaterial
          color={SCENE_COLORS.ivory}
          roughness={0.08}
          metalness={0.1}
          transmission={0.92}
          thickness={1.1}
          ior={1.4}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.45, 1]} />
        <meshStandardMaterial
          color={SCENE_COLORS.silver}
          wireframe
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function OrbitRig({ progress, reach }: { progress: ProgressRef; reach: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = progress.current;
    const step = Math.min(dt, 0.05);

    // The whole mechanism turns with the sequence, so the active stage is always
    // presented to the reader rather than the reader hunting for it.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, p * Math.PI * 1.4, 3, step);
    g.rotation.x = Math.sin(t * 0.1) * 0.05 * reach;

    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 11 - p * 1.2, 2, step);
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      1.4 + Math.sin(t * 0.14) * 0.2 * reach,
      2,
      step,
    );
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <OrbitPath progress={progress} />
      <StageNodes progress={progress} />
      <Core progress={progress} />
    </group>
  );
}

export default function LifecycleOrbit({ progress }: { progress: ProgressRef }) {
  const device = useDeviceTier();
  return (
    <>
      <Studio />
      <OrbitRig progress={progress} reach={device.tier === 'mobile' ? 0.3 : 1} />
    </>
  );
}
