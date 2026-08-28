'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { SceneCanvas } from './SceneCanvas';
import { LazyJourneyForms } from './scenes';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The page's single WebGL layer.
 *
 * One canvas, fixed to the viewport, living behind every section for the whole
 * document. Sections no longer own canvases — that approach made the forms pop
 * in and out as unrelated props, and meant several live GL contexts on one page.
 *
 * Scroll position is written into a ref by one document-wide ScrollTrigger and
 * read inside the render loop, so the scene follows the reader at frame rate
 * without re-rendering the React tree.
 *
 * Held at low opacity on purpose. The forms are atmosphere, not subject: at full
 * strength they competed with the type for the reader's attention, and the type
 * is what carries the argument. Dimming here rather than in the materials keeps
 * the lighting rig intact and makes the level a single number to tune.
 */
export function GlobalScene() {
  const progress = useRef(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      // Reduced motion still gets a composed still, just not a moving one.
      progress.current = 0.2;
      return;
    }

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => st.kill();
  }, [reduced]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-[0.22]">
      <SceneCanvas
        alwaysRender
        rootMargin="0px"
        camera={{ position: [0, 0, 11], fov: 42 }}
      >
        <LazyJourneyForms progress={progress} />
      </SceneCanvas>
    </div>
  );
}
