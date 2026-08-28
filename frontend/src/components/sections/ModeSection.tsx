'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/typography';
import { AudienceToggle } from '@/components/motion/AudienceToggle';
import { useAudience } from '@/components/motion/AudienceProvider';
import { AUDIENCE_CAPABILITIES } from '@/data/knowledge';

/**
 * The same pathway, read from either side.
 *
 * Pure Framer Motion: this is an interface state change, not a scroll story.
 * The list swaps in place with a shared-layout indicator on the toggle — no
 * navigation, no reload, no scroll position lost.
 */
export function ModeSection() {
  const { audience } = useAudience();
  const capabilities = AUDIENCE_CAPABILITIES[audience];

  return (
    <section
      id="modes"
      aria-label="Government and startup views"
      className="relative w-full ground-paper py-[clamp(6rem,14vh,11rem)] text-ink"
    >
      <div className="edge mx-auto max-w-[110rem]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Label className="text-ink-muted">One pathway, two sides</Label>
            <h2 className="mt-6 max-w-[16ch] font-display text-display-sm font-medium uppercase leading-[0.9] text-ink">
              The same record, read from either end.
            </h2>
          </div>

          <AudienceToggle className="border-ink/20" />
        </div>

        <div className="mt-16 min-h-[26rem]">
          <AnimatePresence mode="wait">
            <motion.ol
              key={audience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
            >
              {capabilities.map((c, i) => (
                <motion.li
                  key={c.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="border-t border-ink/15 pt-5"
                >
                  <span className="font-mono text-meta uppercase text-saffron">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-display text-2xl uppercase leading-none text-ink">
                    {c.label}
                  </h3>
                  <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink-muted">
                    {c.detail}
                  </p>
                </motion.li>
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
