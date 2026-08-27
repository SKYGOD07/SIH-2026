'use client';

import { Environment, Lightformer } from '@react-three/drei';

/**
 * Shared lighting rig.
 *
 * Built from Lightformers rather than a `preset` HDRI so nothing is fetched
 * from a CDN at runtime — the page has to render on a government network with
 * no external asset access. The result is a soft studio: one broad key from
 * above, a warm saffron rim, a cool fill, and a low bounce.
 */
export function Studio({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} color="#d8d3c8" />
      <directionalLight position={[6, 9, 6]} intensity={1.15 * intensity} color="#fdf6ea" />
      <directionalLight position={[-7, 3, -5]} intensity={0.4 * intensity} color="#9fb0c4" />

      <Environment resolution={128} frames={1}>
        {/* broad soft key */}
        <Lightformer
          form="rect"
          intensity={2.4 * intensity}
          color="#fffaf2"
          position={[0, 6, 4]}
          rotation={[-Math.PI / 2.4, 0, 0]}
          scale={[14, 8, 1]}
        />
        {/* warm rim — the saffron accent, kept off the diffuse surfaces */}
        <Lightformer
          form="rect"
          intensity={2.1 * intensity}
          color="#f0873a"
          position={[-7, 1.5, -3]}
          rotation={[0, Math.PI / 2.6, 0]}
          scale={[8, 6, 1]}
        />
        {/* cool counter-fill keeps the metal from going orange all over */}
        <Lightformer
          form="rect"
          intensity={1.2 * intensity}
          color="#aebdd0"
          position={[7, 0, -2]}
          rotation={[0, -Math.PI / 2.6, 0]}
          scale={[8, 6, 1]}
        />
        {/* low bounce */}
        <Lightformer
          form="rect"
          intensity={0.6 * intensity}
          color="#3a3934"
          position={[0, -5, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 6, 1]}
        />
      </Environment>
    </>
  );
}

/** Palette shared between the DOM and the scenes, so they never drift apart. */
export const SCENE_COLORS = {
  ivory: '#f5f2ec',
  silver: '#a9a69c',
  graphite: '#3a3934',
  ink: '#0a0a09',
  saffron: '#e4762a',
  saffronLight: '#f2933f',
  validated: '#5e8b6a',
  risk: '#b4483c',
} as const;
