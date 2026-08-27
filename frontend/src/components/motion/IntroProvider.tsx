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
  beginReveal: () => void;
  complete: () => void;
}

const IntroContext = createContext<IntroContextValue>({
  phase: 'ready',
  canAnimate: true,
  beginReveal: () => {},
  complete: () => {},
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
 */
export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>('loading');

  const beginReveal = useCallback(() => {
    setPhase((p) => (p === 'loading' ? 'revealing' : p));
  }, []);

  const complete = useCallback(() => setPhase('ready'), []);

  const value = useMemo<IntroContextValue>(
    () => ({
      phase,
      canAnimate: phase !== 'loading',
      beginReveal,
      complete,
    }),
    [phase, beginReveal, complete],
  );

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export const useIntro = () => useContext(IntroContext);
