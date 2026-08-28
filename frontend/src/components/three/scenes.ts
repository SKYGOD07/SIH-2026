'use client';

import dynamic from 'next/dynamic';

/**
 * Every 3D scene is code-split and client-only.
 *
 * Three.js plus the scene graph is by far the heaviest thing on the page; none
 * of it belongs in the initial bundle, and none of it can render on the server.
 * Importing from here keeps that guarantee in one place.
 */

export const LazyJourneyForms = dynamic(() => import('./JourneyForms'), { ssr: false });
