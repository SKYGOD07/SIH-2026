'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded, clamp } from '@/lib/utils';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier, scaleCount } from '@/hooks/useDeviceTier';
import { Studio, SCENE_COLORS } from './Studio';

/**
 * The pilot sandbox: a miniature municipal ward the solution is deployed into.
 *
 * This is where the experience leaves abstraction. The four milestones each
 * change the environment physically — sensors appear (M1), the network carries
 * data (M2), leaks are located and resolved (M3), the ward reports (M4) — so
 * the reader watches the pilot happen rather than reading that it did.
 */

const GRID = 7;
const CELL = 1.55;

interface Block {
  x: number;
  z: number;
  height: number;
  /** Buildings only; road cells are skipped. */
  road: boolean;
}

function buildWard(): Block[] {
  const rand = seeded(1907);
  const blocks: Block[] = [];
  for (let ix = 0; ix < GRID; ix++) {
    for (let iz = 0; iz < GRID; iz++) {
      const road = ix === 3 || iz === 2 || iz === 5;
      blocks.push({
        x: (ix - (GRID - 1) / 2) * CELL,
        z: (iz - (GRID - 1) / 2) * CELL,
        height: road ? 0.04 : 0.35 + Math.pow(rand(), 1.7) * 2.4,
        road,
      });
    }
  }
  return blocks;
}

function Buildings({ progress }: { progress: ProgressRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blocks = useMemo(buildWard, []);
  const eased = useRef(0);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    eased.current = damp(eased.current, progress.current, 3, Math.min(dt, 0.05));
    // Buildings rise once, early — the ward exists before the pilot starts.
    const rise = clamp(eased.current / 0.18, 0, 1);

    blocks.forEach((b, i) => {
      const h = Math.max(b.height * rise, 0.001);
      dummy.position.set(b.x, h / 2, b.z);
      dummy.scale.set(b.road ? CELL * 0.94 : CELL * 0.72, h, b.road ? CELL * 0.94 : CELL * 0.72);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, blocks.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={SCENE_COLORS.graphite} roughness={0.82} metalness={0.12} />
    </instancedMesh>
  );
}

/** The buried water main: a lattice under the ward that lights along its length. */
function Pipeline({ progress }: { progress: ProgressRef }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(() => {
    const path: THREE.Vector3[] = [];
    const half = ((GRID - 1) / 2) * CELL;
    // A serpentine main running the length of the ward under the road cells.
    for (let i = 0; i < GRID; i++) {
      const z = (i - (GRID - 1) / 2) * CELL;
      const dir = i % 2 === 0 ? 1 : -1;
      path.push(new THREE.Vector3(-half * dir, -0.16, z));
      path.push(new THREE.Vector3(half * dir, -0.16, z));
    }
    const curve = new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.02);
    return new THREE.TubeGeometry(curve, 220, 0.035, 6, false);
  }, []);

  useFrame((state, dt) => {
    const m = matRef.current;
    if (!m) return;
    const p = progress.current;
    const t = state.clock.elapsedTime;
    // Data starts flowing at M2 and stays on.
    const live = clamp((p - 0.3) / 0.25, 0, 1);
    m.emissiveIntensity = THREE.MathUtils.damp(
      m.emissiveIntensity,
      live * (0.5 + Math.sin(t * 1.6) * 0.14),
      3,
      Math.min(dt, 0.05),
    );
  });

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color={SCENE_COLORS.silver}
        emissive={SCENE_COLORS.saffron}
        emissiveIntensity={0}
        roughness={0.4}
        metalness={0.7}
      />
    </mesh>
  );
}

/** Sensor nodes installed at M1, reporting from M2, flagging leaks at M3. */
function Sensors({ progress, count }: { progress: ProgressRef; count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const idle = useMemo(() => new THREE.Color(SCENE_COLORS.silver), []);
  const active = useMemo(() => new THREE.Color(SCENE_COLORS.saffronLight), []);
  const resolved = useMemo(() => new THREE.Color(SCENE_COLORS.validated), []);

  const nodes = useMemo(() => {
    const rand = seeded(2311);
    const half = ((GRID - 1) / 2) * CELL;
    return Array.from({ length: count }, (_, i) => ({
      x: (rand() - 0.5) * half * 2,
      z: (rand() - 0.5) * half * 2,
      /** Order of installation, and which nodes find a leak. */
      order: i / count,
      leak: rand() < 0.22,
      phase: rand() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Sensors switch state at discrete milestones, so the raw progress is read
    // directly rather than damped — the transitions are already eased by the
    // clamped windows below.
    const p = progress.current;
    const t = state.clock.elapsedTime;

    const deploy = clamp((p - 0.12) / 0.22, 0, 1); // M1
    const collect = clamp((p - 0.36) / 0.2, 0, 1); // M2
    const validate = clamp((p - 0.6) / 0.2, 0, 1); // M3

    nodes.forEach((n, i) => {
      const installed = clamp((deploy - n.order * 0.55) * 3, 0, 1);
      const lift = 0.18 + Math.sin(t * 1.1 + n.phase) * 0.03 * collect;
      dummy.position.set(n.x, lift * installed, n.z);
      dummy.scale.setScalar(Math.max(0.001, 0.07 * installed * (1 + collect * 0.25)));
      dummy.rotation.set(0, t * 0.4 + n.phase, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.copy(idle);
      if (collect > 0) color.lerp(active, collect * (n.leak ? 1 : 0.35));
      if (n.leak && validate > 0) color.lerp(resolved, validate);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial
        emissive={SCENE_COLORS.saffron}
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.5}
      />
    </instancedMesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow={false}>
      <planeGeometry args={[GRID * CELL + 3, GRID * CELL + 3]} />
      <meshStandardMaterial color="#0b1114" roughness={0.95} metalness={0} />
    </mesh>
  );
}

function WardCamera({ progress }: { progress: ProgressRef }) {
  useFrame((state, dt) => {
    const p = progress.current;
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);
    // Descends from a survey view into the ward as the pilot proceeds.
    const radius = 15 - p * 4.5;
    const angle = -0.5 + p * 0.85 + Math.sin(t * 0.08) * 0.05;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, Math.sin(angle) * radius, 2, step);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, Math.cos(angle) * radius, 2, step);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 9.5 - p * 5, 2, step);
    state.camera.lookAt(0, 0.6, 0);
  });
  return null;
}

export default function PilotCity({ progress }: { progress: ProgressRef }) {
  const device = useDeviceTier();
  const sensors = scaleCount(56, device);

  return (
    <>
      <Studio intensity={0.85} />
      <group position={[0, -1.2, 0]}>
        <Ground />
        <Buildings progress={progress} />
        <Pipeline progress={progress} />
        <Sensors progress={progress} count={sensors} />
      </group>
      <WardCamera progress={progress} />
    </>
  );
}
