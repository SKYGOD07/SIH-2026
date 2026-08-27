import { gsap, ScrollTrigger, SCRUB } from '@/lib/gsap';

/** Vertical masked reveal — the house entrance for split text. */
export const REVEAL_FROM: gsap.TweenVars = { yPercent: 110, opacity: 0 };
export const REVEAL_TO: gsap.TweenVars = {
  yPercent: 0,
  opacity: 1,
  duration: 1.05,
  ease: 'expo.out',
};

export function revealTargets(
  targets: Element[] | Element,
  vars: gsap.TweenVars = {},
): gsap.core.Tween {
  return gsap.fromTo(targets, REVEAL_FROM, { ...REVEAL_TO, stagger: 0.055, ...vars });
}

/** Reveal that fires once when the element scrolls into view. */
export function revealOnEnter(
  targets: Element[] | Element,
  trigger: Element,
  vars: gsap.TweenVars = {},
): gsap.core.Tween {
  return revealTargets(targets, {
    ...vars,
    scrollTrigger: { trigger, start: 'top 82%', once: true },
  });
}

/** Standard pinned, scrubbed timeline. `length` is measured in viewport heights. */
export function pinnedTimeline(
  trigger: Element,
  length = 3,
  extra: Record<string, unknown> = {},
): gsap.core.Timeline {
  return gsap.timeline({
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: () => '+=' + window.innerHeight * length,
      pin: true,
      scrub: SCRUB,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      ...extra,
    },
  });
}

/** Depth parallax. Higher strength = larger differential from the page. */
export function parallax(target: Element, strength = 8, trigger?: Element): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { yPercent: -strength },
    {
      yPercent: strength,
      ease: 'none',
      scrollTrigger: {
        trigger: trigger ?? target,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    },
  );
}

/** Refresh ScrollTrigger after fonts settle — prevents pin math drifting. */
export function refreshAfterFonts(): void {
  if (typeof document === 'undefined') return;
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts?.ready) fonts.ready.then(() => ScrollTrigger.refresh());
}
