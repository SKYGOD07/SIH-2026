'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '@/lib/utils';
import { damp, type ProgressRef } from '@/lib/three/progress';
import { useDeviceTier, scaleCount, type DeviceProfile } from '@/hooks/useDeviceTier';
import { Studio, SCENE_COLORS } from './Studio';

/**
 * The hero object: a government problem, fragmented, that assembles into a
 * structured system as the reader scrolls.
 *
 * Three instanced layers plus one point cloud — no loaded models, no per-object
 * draw calls. Every element holds two positions (scattered / assembled) and the
 * frame loop interpolates between them from the scroll progress ref.
 */

interface Layout {
  scattered: Float32Array;
  assembled: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
}

/** Fragment layout: paper-thin shards drifting in, settling into a shell. */
function buildFragments(count: number, seed: number, radius: number): Layout {
  const rand = seeded(seed);
  const scattered = new Float32Array(count * 3);
  const assembled = new Float32Array(count * 3);
  const rotation = new Float32Array(count * 3);
  const scale = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // scattered: a wide, loose, disordered cloud
    scattered[i * 3] = (rand() - 0.5) * 16;
    scattered[i * 3 + 1] = (rand() - 0.5) * 11;
    scattered[i * 3 + 2] = (rand() - 0.5) * 12 - 2;

    // assembled: a Fibonacci shell — even coverage, no visible banding
    const t = (i + 0.5) / count;
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = radius * (0.82 + rand() * 0.28);
    assembled[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    assembled[i * 3 + 1] = r * Math.cos(phi) * 0.72;
    assembled[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    rotation[i * 3] = rand() * Math.PI;
    rotation[i * 3 + 1] = rand() * Math.PI;
    rotation[i * 3 + 2] = rand() * Math.PI;
    scale[i] = 0.55 + rand() * 0.75;
  }

  return { scattered, assembled, rotation, scale };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function DocumentFragments({
  progress,
  count,
}: {
  progress: ProgressRef;
  count: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layout = useMemo(() => buildFragments(count, 11, 3.5), [count]);
  const eased = useRef(0);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    eased.current = damp(eased.current, easeInOut(progress.current), 4.5, Math.min(dt, 0.05));
    const p = eased.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      dummy.position.set(
        THREE.MathUtils.lerp(layout.scattered[i3], layout.assembled[i3], p),
        THREE.MathUtils.lerp(layout.scattered[i3 + 1], layout.assembled[i3 + 1], p),
        THREE.MathUtils.lerp(layout.scattered[i3 + 2], layout.assembled[i3 + 2], p),
      );
      // Disorder resolves into alignment: rotation converges on the shell normal.
      dummy.rotation.set(
        THREE.MathUtils.lerp(layout.rotation[i3], 0, p),
        THREE.MathUtils.lerp(layout.rotation[i3 + 1], Math.atan2(dummy.position.x, dummy.position.z), p),
        THREE.MathUtils.lerp(layout.rotation[i3 + 2], 0, p),
      );
      const s = layout.scale[i] * (1 - 0.22 * p);
      dummy.scale.set(s, s * 1.32, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow={false}>
      <planeGeometry args={[0.5, 0.66]} />
      <meshPhysicalMaterial
        color={SCENE_COLORS.ivory}
        roughness={0.62}
        metalness={0.05}
        transmission={0.28}
        thickness={0.2}
        transparent
        opacity={0.86}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function DataNodes({ progress, count }: { progress: ProgressRef; count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layout = useMemo(() => buildFragments(count, 29, 2.35), [count]);
  const eased = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    eased.current = damp(eased.current, easeInOut(progress.current), 3.6, Math.min(dt, 0.05));
    const p = eased.current;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // A slow individual breath keeps the assembled state alive rather than frozen.
      const breathe = 1 + Math.sin(t * 0.6 + i) * 0.04 * p;
      dummy.position.set(
        THREE.MathUtils.lerp(layout.scattered[i3] * 1.2, layout.assembled[i3] * breathe, p),
        THREE.MathUtils.lerp(layout.scattered[i3 + 1] * 1.2, layout.assembled[i3 + 1] * breathe, p),
        THREE.MathUtils.lerp(layout.scattered[i3 + 2] * 1.2, layout.assembled[i3 + 2] * breathe, p),
      );
      const s = layout.scale[i] * (0.1 + 0.09 * p);
      dummy.scale.setScalar(s);
      dummy.rotation.set(t * 0.15 + i, t * 0.1 + i, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={SCENE_COLORS.saffronLight}
        emissive={SCENE_COLORS.saffron}
        emissiveIntensity={0.55}
        roughness={0.3}
        metalness={0.65}
      />
    </instancedMesh>
  );
}

/** Thin structural lines that only exist once the system has formed. */
function Connections({ progress, count }: { progress: ProgressRef; count: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  const geometry = useMemo(() => {
    const rand = seeded(53);
    const points: number[] = [];
    const radius = 2.35;
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const phi = Math.acos(1 - 2 * t);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = radius * (0.82 + rand() * 0.28);
      nodes.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) * 0.72,
          r * Math.sin(phi) * Math.sin(theta),
        ),
      );
    }
    // Connect each node to its nearest neighbours only — a lattice, not a hairball.
    nodes.forEach((a, i) => {
      const near = nodes
        .map((b, j) => ({ j, d: a.distanceTo(b) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      near.forEach(({ j }) => {
        points.push(a.x, a.y, a.z, nodes[j].x, nodes[j].y, nodes[j].z);
      });
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [count]);

  useFrame((_, dt) => {
    const mat = matRef.current;
    const line = ref.current;
    if (!mat || !line) return;
    const p = easeInOut(progress.current);
    mat.opacity = damp(mat.opacity, Math.max(0, p * 0.5 - 0.08), 4, Math.min(dt, 0.05));
    line.scale.setScalar(0.9 + 0.1 * p);
  });

  // Geometry is built here rather than declaratively, so disposing it is ours.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial
        ref={matRef}
        color={SCENE_COLORS.silver}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function AmbientParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const rand = seeded(97);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 26;
      arr[i * 3 + 1] = (rand() - 0.5) * 16;
      arr[i * 3 + 2] = (rand() - 0.5) * 20 - 6;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={SCENE_COLORS.silver}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** The whole assembly, rotating slowly, with a restrained camera drift. */
function Rig({ progress, device }: { progress: ProgressRef; device: DeviceProfile }) {
  const group = useRef<THREE.Group>(null);

  const fragments = scaleCount(46, device);
  const nodes = scaleCount(54, device);
  const particles = scaleCount(1400, device);
  const lattice = Math.min(nodes, device.tier === 'mobile' ? 18 : 34);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = easeInOut(progress.current);
    const t = state.clock.elapsedTime;

    g.rotation.y = t * 0.075 + p * 0.9;
    g.rotation.x = Math.sin(t * 0.12) * 0.06 - p * 0.1;

    // Camera moves a little; the object does the work. Reduced on small screens.
    const reach = device.tier === 'mobile' ? 0.25 : 1;
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      12.5 - p * 3.4,
      2.5,
      Math.min(dt, 0.05),
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      Math.sin(t * 0.18) * 0.28 * reach + p * 0.4,
      2,
      Math.min(dt, 0.05),
    );
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <DocumentFragments progress={progress} count={fragments} />
      <DataNodes progress={progress} count={nodes} />
      <Connections progress={progress} count={lattice} />
      <AmbientParticles count={particles} />
    </group>
  );
}

export default function ProblemNode({ progress }: { progress: ProgressRef }) {
  const device = useDeviceTier();
  return (
    <>
      <Studio />
      <Rig progress={progress} device={device} />
    </>
  );
}
