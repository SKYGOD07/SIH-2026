'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface SceneCanvasProps extends Omit<CanvasProps, 'children' | 'dpr'> {
  children: ReactNode;
  className?: string;
  /** Rendered instead of the canvas under reduced-motion / no-WebGL. */
  fallback?: ReactNode;
  /** Margin around the viewport at which the scene mounts. */
  rootMargin?: string;
  /** Keep rendering while off-screen. Almost never wanted. */
  alwaysRender?: boolean;
}

/**
 * The only place a WebGL context is created.
 *
 * Three rules are enforced here rather than in every scene:
 *  1. The canvas mounts only when it is near the viewport, and unmounts when it
 *     is far away — so the page never holds several live contexts at once.
 *  2. The render loop is suspended (`frameloop="never"`) while off-screen, so a
 *     scene that stays mounted still costs nothing.
 *  3. Device pixel ratio is capped from the device profile. Uncapped DPR on a
 *     3x phone is the single most common cause of a beautiful 20 FPS page.
 */
export function SceneCanvas({
  children,
  className,
  fallback = null,
  rootMargin = '25% 0px',
  alwaysRender = false,
  camera,
  ...rest
}: SceneCanvasProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const { dprCap, ready, lowPower } = useDeviceTier();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;

    // Near-viewport observer decides mount/unmount.
    const mountObserver = new IntersectionObserver(
      ([entry]) => setMounted(entry.isIntersecting),
      { rootMargin },
    );
    // Tight observer decides whether frames are drawn at all.
    const renderObserver = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '0px' },
    );

    mountObserver.observe(el);
    renderObserver.observe(el);

    const onVisibility = () => {
      if (document.hidden) setVisible(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountObserver.disconnect();
      renderObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rootMargin]);

  const canRender = ready && !reduced;

  return (
    <div ref={holderRef} className={cn('relative h-full w-full', className)}>
      {canRender && mounted ? (
        <Canvas
          dpr={[1, dprCap]}
          frameloop={alwaysRender || visible ? 'always' : 'never'}
          gl={{
            antialias: !lowPower,
            alpha: true,
            powerPreference: 'high-performance',
            // Depth-of-field style effects are not used; skip the stencil buffer.
            stencil: false,
          }}
          camera={{ fov: 38, near: 0.1, far: 120, position: [0, 0, 12], ...camera }}
          {...rest}
        >
          <Suspense fallback={null}>
            {children}
            <Preload all />
          </Suspense>
        </Canvas>
      ) : (
        fallback
      )}
    </div>
  );
}
