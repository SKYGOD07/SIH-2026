'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, SCRUB } from '@/lib/gsap';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { SceneFallback } from '@/components/three/SceneFallback';
import { LazyEvidenceField } from '@/components/three/scenes';
import { Label } from '@/components/typography';
import {
  EVIDENCE_SOURCES,
  PRIMARY_RETRIEVAL,
  RETRIEVAL_STAGES,
  SOURCE_LABEL,
  getSource,
} from '@/data/evidence';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { clamp } from '@/lib/utils';

/**
 * The retrieval sequence.
 *
 * QUESTION -> RETRIEVAL -> SOURCE DOCUMENTS -> EVIDENCE -> AI EXPLANATION.
 *
 * The two registers are held visually apart on purpose: retrieved passages are
 * set in the document register — ivory panel, serif-weight quotation, citation
 * attached — while the model's synthesis sits in a bordered block, labelled,
 * with the human decision owner stated underneath it. A reader skimming should
 * never be able to mistake the second for the first.
 */
export function EvidenceSection() {
  const rootRef = useRef<HTMLElement>(null);
  const sceneProgress = useRef(0);
  const [stage, setStage] = useState(0);
  const reduced = usePrefersReducedMotion();

  const cited = PRIMARY_RETRIEVAL.sourceIds
    .map(getSource)
    .filter((s): s is (typeof EVIDENCE_SOURCES)[number] => Boolean(s));

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        sceneProgress.current = 1;
        setStage(RETRIEVAL_STAGES.length - 1);
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => build(6));
      mm.add('(max-width: 767px)', () => build(4));

      function build(length: number) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => '+=' + window.innerHeight * length,
            pin: true,
            scrub: SCRUB,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              sceneProgress.current = self.progress;
              const next = clamp(
                Math.floor(self.progress * RETRIEVAL_STAGES.length),
                0,
                RETRIEVAL_STAGES.length - 1,
              );
              setStage((current) => (current === next ? current : next));
            },
          },
        });
        tl.to({}, { duration: 1 });
        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      }

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  const showSources = stage >= 2;
  const showEvidence = stage >= 3;
  const showAnalysis = stage >= 4;

  return (
    <section
      ref={rootRef}
      id="evidence"
      aria-label="Evidence retrieval"
      className="relative h-[100svh] w-full overflow-hidden ground-abyss"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <SceneCanvas
          camera={{ position: [0, 0, 9], fov: 46 }}
          fallback={<SceneFallback variant="archive" />}
        >
          <LazyEvidenceField progress={sceneProgress} />
        </SceneCanvas>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,15,18,0.85)_0%,rgba(13,15,18,0.2)_35%,rgba(13,15,18,0.92)_85%)]"
      />

      <div className="edge relative z-10 mx-auto flex h-full min-h-0 max-w-[110rem] flex-col justify-between pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nav-safe)+clamp(0.75rem,3vh,2.5rem))]">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <Label index="03" tone="accent">
              Evidence retrieval
            </Label>
            <p className="mt-5 max-w-[24ch] font-display text-display-xs font-medium uppercase leading-[0.95] text-bone">
              {PRIMARY_RETRIEVAL.question}
            </p>
          </div>

          <ol className="hidden shrink-0 space-y-1.5 sm:block">
            {RETRIEVAL_STAGES.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === stage ? 'step' : undefined}
                className={
                  'flex items-center gap-3 font-mono text-meta uppercase transition-colors duration-500 ' +
                  (i === stage ? 'text-saffron-light' : i < stage ? 'text-bone/50' : 'text-bone/25')
                }
              >
                <span className="w-4 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* --- source register: retrieved documents, verbatim --- */}
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <Label>Source evidence</Label>
              <AnimatePresence>
                {showSources ? (
                  <motion.span
                    key="found"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-meta uppercase text-saffron-light"
                  >
                    {cited.length} relevant sources found
                  </motion.span>
                ) : (
                  <motion.span
                    key="retrieving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-meta uppercase text-stone-light"
                  >
                    Retrieving evidence…
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <ul className="mt-5 space-y-3">
              {cited.map((src, i) => (
                <motion.li
                  key={src.id}
                  initial={false}
                  animate={{
                    opacity: showSources ? 1 : 0.12,
                    y: showSources ? 0 : 14,
                  }}
                  transition={{ delay: showSources ? i * 0.09 : 0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-l-2 border-saffron bg-bone/[0.05] p-4 backdrop-blur-[2px]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-meta uppercase text-saffron-light">
                      {SOURCE_LABEL[src.kind]}
                    </span>
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-stone-light">
                      {src.id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-snug text-bone">{src.title}</p>
                  <AnimatePresence>
                    {showEvidence ? (
                      <motion.blockquote
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-sm italic leading-relaxed text-bone/75">
                          “{src.excerpt}”
                        </p>
                        <cite className="mt-2 block font-mono text-[0.625rem] not-italic uppercase tracking-[0.12em] text-stone-light">
                          {src.reference}
                        </cite>
                      </motion.blockquote>
                    ) : null}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* --- model register: analysis, clearly marked as assistive --- */}
          <div>
            <Label>AI explanation</Label>
            <motion.div
              initial={false}
              animate={{ opacity: showAnalysis ? 1 : 0.1, y: showAnalysis ? 0 : 18 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 border border-dashed border-bone/25 p-6"
            >
              <span className="font-mono text-meta uppercase text-stone-light">
                Generated analysis · drawn only from the cited passages
              </span>
              <p className="mt-4 text-pretty text-base leading-relaxed text-bone/90">
                {PRIMARY_RETRIEVAL.analysis}
              </p>

              <div className="mt-6 border-t border-bone/15 pt-4">
                <span className="font-mono text-meta uppercase text-stone-light">Cites</span>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {cited.map((src) => (
                    <li key={src.id} className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-saffron-light">
                      {src.id} · {SOURCE_LABEL[src.kind]}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 border-t border-bone/15 pt-4 text-xs leading-relaxed text-stone-light">
                {PRIMARY_RETRIEVAL.decisionOwner} This analysis is an aid to that determination and
                carries no authority of its own.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
