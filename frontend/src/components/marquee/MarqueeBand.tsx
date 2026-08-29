import { Fragment } from 'react';
import { cn } from '@/lib/utils';

/**
 * An infinite marquee ticker on a tilted ribbon.
 *
 * Heavy uppercase type, alternating outlined and solid, running forever across
 * a white band tilted off a grained red ground. The styling lives in
 * `.marquee-*` in globals.css — the tilt geometry, the grain and the loop
 * distance are all interdependent, and splitting them between a stylesheet and
 * a className string is how one of them quietly stops matching the others.
 *
 * This renders on the server and runs on CSS alone. No JavaScript measures
 * anything, nothing subscribes to scroll, and there is no hydration step
 * between the first paint and the animation starting.
 *
 * Two details that look cosmetic and are not:
 *
 * The track is the phrase list rendered exactly twice and translated by -50%.
 * At the end of each cycle the second copy occupies the position the first
 * started from, so the reset is invisible. This only holds while one copy is at
 * least as wide as the viewport — a very short list on a very wide screen will
 * show the ribbon run out, and the fix is more phrases, not a longer duration.
 *
 * And the list is padded to an even length. The outline/solid alternation is
 * computed per item, so an odd count puts two same-styled phrases together at
 * the seam where the copies meet — the one place the loop would become visible.
 */

export interface MarqueeBandProps {
  /**
   * The phrases, in order. Alternates outlined, solid, outlined…
   *
   * Give it enough to overflow a wide viewport; see the note above about the
   * seam. Six short phrases is comfortable at typical desktop widths.
   */
  items: string[];
  /** Seconds for one full pass. Higher is slower. */
  speed?: number;
  /** Ribbon tilt in degrees. Negative lifts the right-hand end. */
  angle?: number;
  /** The ground behind the ribbon. */
  background?: string;
  className?: string;
  /** Announced to assistive technology in place of the scrolling text. */
  label?: string;
}

/**
 * The separator: two outlined bars, drawn in `em` so it scales with the type.
 *
 * An SVG rather than a character. A dash glyph would be at the mercy of
 * whichever font actually loaded, and this needs to hold its weight against
 * 900-weight type next to it.
 */
function Separator() {
  return (
    <span aria-hidden="true" className="mx-[0.5em] inline-flex shrink-0 items-center">
      <svg
        viewBox="0 0 44 24"
        fill="none"
        stroke="#000000"
        strokeWidth="2.5"
        className="h-[0.42em] w-[0.77em]"
        preserveAspectRatio="none"
      >
        <rect x="1.25" y="1.25" width="41.5" height="8" rx="4" />
        <rect x="1.25" y="14.75" width="41.5" height="8" rx="4" />
      </svg>
    </span>
  );
}

export function MarqueeBand({
  items,
  speed = 26,
  angle = -3.5,
  background = '#C40D12',
  className,
  label,
}: MarqueeBandProps) {
  // Padded to even, so the alternation never doubles up at the seam.
  const phrases = items.length % 2 === 0 ? items : [...items, ...items];

  const half = (
    <>
      {phrases.map((phrase, i) => (
        <Fragment key={`${phrase}-${i}`}>
          <span
            className={cn(
              'shrink-0 whitespace-nowrap font-display text-[clamp(1.75rem,5.5vw,4.5rem)] font-black uppercase leading-none tracking-[-0.03em]',
              i % 2 === 0 ? 'marquee-outline' : 'marquee-solid',
            )}
          >
            {phrase}
          </span>
          <Separator />
        </Fragment>
      ))}
    </>
  );

  return (
    <section
      aria-label={label ?? items.join(', ')}
      className={cn('marquee-band', className)}
      style={{
        ['--marquee-duration' as string]: `${speed}s`,
        ['--marquee-angle' as string]: `${angle}deg`,
        backgroundColor: background,
      }}
    >
      <div className="marquee-ribbon py-[clamp(0.6rem,1.8vw,1.35rem)]">
        <div className="marquee-track">
          {/* The read copy. */}
          <div className="flex shrink-0 items-center">{half}</div>
          {/* The seam copy — identical, and hidden from assistive technology so
              the phrases are not announced twice. */}
          <div aria-hidden="true" className="flex shrink-0 items-center">
            {half}
          </div>
        </div>
      </div>
    </section>
  );
}
