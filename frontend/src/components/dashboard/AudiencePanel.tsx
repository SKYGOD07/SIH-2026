'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/typography';
import { useAudience } from '@/components/motion/AudienceProvider';
import { AUDIENCE_CAPABILITIES, AUDIENCE_LABEL } from '@/data/knowledge';
import { cn } from '@/lib/utils';

/**
 * The console's action list, switched by the audience toggle in the page header.
 *
 * The same provider drives the toggle and this panel, so switching point of view
 * is a state change that leaves the reader exactly where they were — no route
 * change, no reload, no scroll position lost.
 */
export function AudiencePanel({ className }: { className?: string }) {
  const { audience } = useAudience();
  const capabilities = AUDIENCE_CAPABILITIES[audience];

  return (
    <section className={cn('border-t border-ivory/10 pt-10', className)} aria-live="polite">
      <Label tone="accent">{AUDIENCE_LABEL[audience]} actions</Label>

      <AnimatePresence mode="wait">
        <motion.ol
          key={audience}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {capabilities.map((c, i) => (
            <motion.li
              key={c.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.04, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-ivory/10 pt-4"
            >
              <span className="font-mono text-meta uppercase text-silver">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display text-xl uppercase leading-none text-ivory">
                {c.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-silver">{c.detail}</p>
            </motion.li>
          ))}
        </motion.ol>
      </AnimatePresence>
    </section>
  );
}
