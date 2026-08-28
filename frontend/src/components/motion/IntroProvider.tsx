'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type IntroPhase = 'loading' | 'revealing' | 'ready';

interface IntroContextValue {
  phase: IntroPhase;
  /** True once the curtain has started lifting — the cue for entrance animations. */
  canAnimate: boolean;
  /** True once the deck's opening slide is behind the reader. */
  heroComplete: boolean;
  beginReveal: () => void;
  complete: () => void;
  /**
   * Set by the landing deck from its pin progress. Two-way, so travelling back
   * to the opening slide closes the navigation again rather than latching it
   * open.
   */
  setHeroComplete: (value: boolean) => void;
}

const IntroContext = createContext<IntroContextValue>({
  phase: 'ready',
  canAnimate: true,
  heroComplete: false,
  beginReveal: () => {},
  complete: () => {},
  setHeroComplete: () => {},
});

/**
 * Owns the boot sequence of the page.
 *
 * Sections do not start their entrance animations on mount — they wait for
 * `canAnimate`. That is what makes the load feel deliberate instead of showing
 * a half-painted hero mid-animation while fonts swap and the first WebGL
 * context is still compiling shaders.
 *
 *   loading  → preloader visible, scroll locked, assets settling
 *   revealing→ curtain lifting, hero intro plays underneath it
 *   ready    → preloader unmounted, ScrollTrigger takes over
 *
 * The `heroComplete` flag is separate from the phase — it tracks when the
 * deck has travelled past its opening slide, so the Nav can stay closed over
 * the opening statement and only expand once there is a page to navigate.
 */
export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>('loading');
  const [heroComplete, setHeroComplete] = useState(false);

  const beginReveal = useCallback(() => {
    setPhase((p) => (p === 'loading' ? 'revealing' : p));
  }, []);

  const complete = useCallback(() => setPhase('ready'), []);


  const value = useMemo<IntroContextValue>(
    () => ({
      phase,
      canAnimate: phase !== 'loading',
      heroComplete,
      beginReveal,
      complete,
      setHeroComplete,
    }),
    [phase, heroComplete, beginReveal, complete],
  );

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export const useIntro = () => useContext(IntroContext);
