'use client';

import dynamic from 'next/dynamic';

/**
 * Every 3D scene is code-split and client-only.
 *
 * Three.js plus the scene graph is by far the heaviest thing on the page; none
 * of it belongs in the initial bundle, and none of it can render on the server.
 * Importing from here — rather than calling `dynamic()` at each call site — keeps
 * that guarantee in one place.
 */

export const LazyProblemNode = dynamic(() => import('./ProblemNode'), { ssr: false });
export const LazyLifecycleOrbit = dynamic(() => import('./LifecycleOrbit'), { ssr: false });
export const LazyStartupNetwork = dynamic(() => import('./StartupNetwork'), { ssr: false });
export const LazyEvidenceField = dynamic(() => import('./EvidenceField'), { ssr: false });
export const LazyPilotCity = dynamic(() => import('./PilotCity'), { ssr: false });
