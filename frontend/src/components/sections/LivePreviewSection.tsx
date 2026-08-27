'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { PipelineFlow } from '@/components/dashboard/PipelineFlow';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { PLATFORM_METRICS } from '@/data/knowledge';
import { DEMO_NOTICE } from '@/data/challenges';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The handover from the cinematic layer to the product.
 *
 * The components rendered here are the same ones the /dashboard route renders.
 * That is the whole argument of the section: what the reader has been watching
 * is a real application, not a film about one.
 */
export function LivePreviewSection() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      // The interface assembles rather than fading in — panel, then chrome,
      // then contents, as if the application were booting.
      gsap.from('[data-console]', {
        autoAlpha: 0,
        y: 60,
        scale: 0.985,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
      });

      gsap.from('[data-metric]', {
        autoAlpha: 0,
        y: 22,
        duration: 0.65,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-console]', start: 'top 72%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="platform"
      aria-label="The platform"
      className="relative w-full ground-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Label index="—">The system</Label>
            <SplitText
              as="h2"
              type="lines"
              className="mt-6 max-w-[18ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory"
            >
              Underneath all of it, a working application.
            </SplitText>
          </div>
          <MagneticButton href="/dashboard" variant="outline" cursorLabel="open">
            Open dashboard <span aria-hidden="true">→</span>
          </MagneticButton>
        </div>

        {/* --- the console --- */}
        <div data-console className="mt-14 border border-ivory/12 bg-ink-900/60 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ivory/10 px-6 py-4">
            <span className="font-mono text-meta uppercase text-ivory">
              MahaInnovate · Department console
            </span>
            <span className="font-mono text-meta uppercase text-silver">
              Simulated environment
            </span>
          </div>

          <div className="px-6 pb-8 pt-2">
            <MetricGrid metrics={PLATFORM_METRICS} />

            <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <Label tone="accent">One challenge, end to end</Label>
                <PipelineFlow className="mt-6" />
              </div>

              <div className="lg:pt-2">
                <Label>What the console holds</Label>
                <ul className="mt-6 space-y-4">
                  {[
                    'Every challenge with its baseline, target and published criteria.',
                    'Every application with the eligibility conclusions and the clauses behind them.',
                    'Every pilot with its milestones, filed evidence and approval trail.',
                    'Every validated result, and every lesson from the ones that missed.',
                  ].map((line) => (
                    <li key={line} className="flex items-baseline gap-4 border-b border-ivory/8 pb-4 text-sm leading-relaxed text-ivory/75">
                      <span aria-hidden="true" className="mt-1 h-px w-5 shrink-0 bg-saffron" />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-xs leading-relaxed text-silver">{DEMO_NOTICE}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
