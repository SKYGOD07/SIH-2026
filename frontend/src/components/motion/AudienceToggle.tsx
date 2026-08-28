'use client';

import { motion } from 'framer-motion';
import { AUDIENCE_LABEL } from '@/data/knowledge';
import type { Audience } from '@/types/platform';
import { cn } from '@/lib/utils';
import { useAudience } from './AudienceProvider';

const ORDER: Audience[] = ['government', 'startup'];

/**
 * Government / Startup switch.
 *
 * The travelling indicator is a shared-layout element, so the two states are
 * visibly one control moving rather than two things fading — Framer Motion's
 * layout animation is exactly the right tool and GSAP is not involved.
 */
export function AudienceToggle({ className }: { className?: string }) {
  const { audience, setAudience } = useAudience();

  return (
    <div
      role="tablist"
      aria-label="Point of view"
      className={cn(
        'inline-flex items-center gap-1 border border-chalk/15 p-1',
        className,
      )}
    >
      {ORDER.map((key) => {
        const active = audience === key;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => setAudience(key)}
            data-cursor="switch"
            className={cn(
              'relative px-5 py-2 font-mono text-meta uppercase transition-colors duration-300',
              active ? 'text-chalk' : 'text-chalk/50 hover:text-chalk',
            )}
          >
            {active ? (
              <motion.span
                layoutId="audience-indicator"
                className="absolute inset-0 bg-signal"
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            ) : null}
            <span className="relative">{AUDIENCE_LABEL[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
