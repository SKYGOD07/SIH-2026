'use client';

import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import { Label, SplitText } from '@/components/typography';
import { GRAPH_CHAIN, GRAPH_EDGES, GRAPH_NODES } from '@/data/knowledge';
import type { GraphNodeKind } from '@/types/platform';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

/**
 * The innovation knowledge graph.
 *
 * Every completed pilot leaves a node. Hovering (or focusing) one exposes its
 * metadata, because the claim of the section — that pilots produce institutional
 * intelligence — only lands if the intelligence is inspectable.
 *
 * SVG with keyboard-reachable nodes rather than a canvas: the metadata has to be
 * readable by assistive technology, and a canvas has nothing to read.
 */

const W = 1000;
const H = 620;

const KIND_COLOR: Record<GraphNodeKind, string> = {
  problem: '#A9A69C',
  startup: '#F2933F',
  pilot: '#E4762A',
  result: '#5E8B6A',
  lesson: '#F5F2EC',
  challenge: '#A9A69C',
};

const KIND_LABEL: Record<GraphNodeKind, string> = {
  problem: 'Problem',
  startup: 'Startup',
  pilot: 'Pilot',
  result: 'Result',
  lesson: 'Lesson',
  challenge: 'Future challenge',
};

/** Normalised (-1..1) layout coordinates into the SVG viewBox, with padding. */
const px = (x: number) => W / 2 + x * (W / 2 - 110);
const py = (y: number) => H / 2 + y * (H / 2 - 80);

export function KnowledgeGraphSection() {
  const rootRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();

  const nodeById = useMemo(
    () => new Map(GRAPH_NODES.map((n) => [n.id, n])),
    [],
  );
  const active = activeId ? nodeById.get(activeId) : null;

  const edges = useMemo(
    () =>
      GRAPH_EDGES.map((e) => {
        const from = nodeById.get(e.from);
        const to = nodeById.get(e.to);
        return from && to
          ? {
              id: e.from + '->' + e.to,
              from: e.from,
              to: e.to,
              x1: px(from.x),
              y1: py(from.y),
              x2: px(to.x),
              y2: py(to.y),
            }
          : null;
      }).filter((e): e is NonNullable<typeof e> => Boolean(e)),
    [nodeById],
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || reduced) return;

      // Connections form continuously as the section enters, rather than all
      // appearing at once — the graph reads as accumulating.
      gsap.fromTo(
        '[data-graph-edge]',
        { strokeDashoffset: 1, opacity: 0 },
        {
          strokeDashoffset: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.07,
          ease: 'power2.out',
          scrollTrigger: { trigger: '[data-graph]', start: 'top 78%', once: true },
        },
      );

      gsap.from('[data-graph-node]', {
        opacity: 0,
        scale: 0.3,
        transformOrigin: 'center',
        duration: 0.7,
        stagger: { amount: 0.7, from: 'random' },
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '[data-graph]', start: 'top 78%', once: true },
      });

      gsap.from('[data-chain-word]', {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-graph-chain]', start: 'top 88%', once: true },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={rootRef}
      id="intelligence"
      aria-label="Innovation knowledge graph"
      className="relative w-full ground-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <Label index="—">Institutional intelligence</Label>
        <SplitText
          as="h2"
          type="lines"
          className="mt-6 max-w-[20ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ivory"
        >
          Every pilot leaves something behind.
        </SplitText>

        {/* --- the chain --- */}
        <ol data-graph-chain className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2">
          {GRAPH_CHAIN.map((word, i) => (
            <li key={word} data-chain-word className="flex items-center gap-4">
              <span className="font-mono text-meta uppercase text-silver">{word}</span>
              {i < GRAPH_CHAIN.length - 1 ? (
                <span aria-hidden="true" className="text-saffron">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_0.8fr]">
          {/* --- the graph --- */}
          <div data-graph className="relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              role="group"
              aria-label="Knowledge graph of problems, startups, pilots, results and lessons"
            >
              {edges.map((e) => {
                const dim =
                  activeId !== null && e.from !== activeId && e.to !== activeId;
                return (
                  <line
                    key={e.id}
                    data-graph-edge
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke="#f5f2ec"
                    strokeOpacity={dim ? 0.06 : 0.22}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    strokeDasharray={1}
                    className="transition-[stroke-opacity] duration-300"
                  />
                );
              })}

              {GRAPH_NODES.map((n) => {
                const isActive = n.id === activeId;
                const dim = activeId !== null && !isActive;
                return (
                  <g
                    key={n.id}
                    data-graph-node
                    tabIndex={0}
                    role="button"
                    aria-label={`${KIND_LABEL[n.kind]}: ${n.label}`}
                    data-cursor="inspect"
                    className="cursor-pointer outline-none focus-visible:opacity-100"
                    onMouseEnter={() => setActiveId(n.id)}
                    onMouseLeave={() => setActiveId((id) => (id === n.id ? null : id))}
                    onFocus={() => setActiveId(n.id)}
                    onBlur={() => setActiveId((id) => (id === n.id ? null : id))}
                  >
                    <circle
                      cx={px(n.x)}
                      cy={py(n.y)}
                      r={isActive ? 11 : 7}
                      fill={KIND_COLOR[n.kind]}
                      fillOpacity={dim ? 0.3 : 1}
                      className="transition-all duration-300"
                    />
                    {/* generous invisible hit area — 7px circles are not a target */}
                    <circle cx={px(n.x)} cy={py(n.y)} r="26" fill="transparent" />
                    <text
                      x={px(n.x) + 18}
                      y={py(n.y) + 4}
                      fontSize="13"
                      letterSpacing="0.6"
                      fill="#f5f2ec"
                      fillOpacity={dim ? 0.25 : isActive ? 0.95 : 0.6}
                      className="pointer-events-none transition-[fill-opacity] duration-300"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* --- inspector --- */}
          <div className="lg:pt-4">
            <Label tone="accent">Node metadata</Label>
            <div className="mt-5 min-h-[15rem] border-t border-ivory/10 pt-5">
              <AnimatePresence mode="wait">
                {active ? (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span
                      className="font-mono text-meta uppercase"
                      style={{ color: KIND_COLOR[active.kind] }}
                    >
                      {KIND_LABEL[active.kind]}
                    </span>
                    <p className="mt-3 font-display text-2xl uppercase leading-tight text-ivory">
                      {active.label}
                    </p>
                    <dl className="mt-6 space-y-3">
                      {active.meta.map((m) => (
                        <div key={m.label} className="flex items-baseline justify-between gap-4 border-b border-ivory/8 pb-2">
                          <dt className="font-mono text-meta uppercase text-silver">{m.label}</dt>
                          <dd className="text-right text-sm text-ivory/85">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                ) : (
                  <motion.p
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-[34ch] text-sm leading-relaxed text-silver"
                  >
                    Select a node to see what it recorded — prior pilots, success rates, failure
                    causes, deployment requirements and the departments each result reached.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {(Object.keys(KIND_LABEL) as GraphNodeKind[]).map((kind) => (
                <li key={kind} className={cn('flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver')}>
                  <span
                    aria-hidden="true"
                    className="block h-2 w-2 rounded-full"
                    style={{ background: KIND_COLOR[kind] }}
                  />
                  {KIND_LABEL[kind]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
