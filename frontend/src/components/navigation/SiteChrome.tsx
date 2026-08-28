'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AmbientBackdrop } from '@/components/motion/AmbientBackdrop';
import { GlobalScene } from '@/components/three/GlobalScene';
import { Preloader } from '@/components/motion/Preloader';
import { Nav } from './Nav';
import { SiteFooter } from './SiteFooter';
import { useIntro } from '@/components/motion/IntroProvider';

/**
 * Which chrome the current route gets.
 *
 * The site is two products sharing a shell. The landing route is a cinematic
 * deck and wants the whole apparatus — opener, drifting ground, travelling 3D
 * forms, floating capsule, marketing footer. The console is a workspace and
 * wants none of it: an opening animation in front of a worklist is an obstacle,
 * a 3D scene behind a chart is noise, and a sidebar has already answered the
 * question the capsule exists to answer.
 *
 * Gating it here rather than inside each component keeps the decision in one
 * readable place, and means adding a console route does not mean remembering to
 * add a guard in five files.
 */

/** The one route that gets the full treatment. */
const CINEMATIC = new Set(['/']);

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cinematic = CINEMATIC.has(pathname);
  const { phase, complete } = useIntro();

  /*
   * The preloader is what normally moves the intro out of `loading`, and
   * `loading` holds the body at `overflow: hidden`. On a route that has no
   * preloader, nothing would ever release it — so the release happens here
   * instead, immediately, on the first render of any non-cinematic route.
   */
  useEffect(() => {
    if (!cinematic && phase !== 'ready') complete();
  }, [cinematic, phase, complete]);

  if (!cinematic) {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      {/*
        Stacking order, bottom to top:
          AmbientBackdrop (z-0, fixed)  — the drifting colour ground
          GlobalScene     (z-0, fixed)  — one WebGL layer for the whole document
          content         (z-10)        — sections, transparent over it
          Nav             (z-50)
          Preloader       (z-120)
        Dark sections are intentionally not opaque so the backdrop reads
        through them; see `.ground-void` in globals.css.
      */}
      <AmbientBackdrop />
      <GlobalScene />
      <Nav />
      <div className="relative z-10">
        <main id="main">{children}</main>
        <SiteFooter />
      </div>
      <Preloader />
    </>
  );
}
