# Hero Section & Navbar Overhaul — Implementation Plan

Redesign the hero section to eliminate generic text, fix overlapping text issues, and defer navbar visibility until the hero scroll animation completes. Inspired by the Noomo/Valentime immersive storytelling approach.

## User Review Required

> [!IMPORTANT]
> **Hero Copy:** The current hero says `"Government problems need better solutions"` which is generic. I propose replacing it with copy that directly speaks to the PS — something more like the problem-solution framing below. Please review the proposed copy.

> [!IMPORTANT]  
> **3D Assets:** You mentioned using free 3D assets from the web. For the hero, I'll look for premium free assets (e.g., from Sketchfab, poly.pizza, etc.). If nothing suitable is found, I'll keep the current custom Three.js forms but fix the layering. Should I prioritize finding free assets, or is fixing the current 3D acceptable for now?

## Open Questions

> [!IMPORTANT]
> **Hero Scroll Length:** The current hero scroll animation covers ~5.6x viewport height (very long scroll). The Noomo sites use similarly long scroll-driven sections. Should I keep this length or shorten it?

> [!IMPORTANT]
> **Navbar Reveal Timing:** Should the navbar slide in from the top once the hero scroll animation is fully complete, or should it fade in slightly before the end (e.g., at 90% progress)?

## Proposed Changes

### Hero Section — Text & Layout Fixes

#### [MODIFY] [Hero.tsx](file:///c:/Udyojak/frontend/src/components/sections/Hero.tsx)

**Problem:** 
1. Text overlapping — the `OPENING` words stack with mixed `z-index` between 3D objects, causing visual collision on scroll
2. `"Government problems need better solutions"` is generic and doesn't convey the actual product idea
3. The VERBS section (`Find them. Test them. Prove them. Scale them.`) is disconnected from the PS

**Changes:**
1. **Replace hero copy** with PS-specific messaging:
   - Opening lines: Something like `"Every year, government\nbets on startups\nwithout evidence.\nWe fix that."` — direct, specific, ownable
   - Verbs become the pipeline stages: `"Identify."` → `"Simulate."` → `"Prove."` → `"Scale."` — matching the actual product pathway
2. **Fix text overlap:** 
   - Remove the interleaved z-index trick (lines behind/in-front of 3D) that causes collisions
   - Instead, give the text a clean layer ABOVE the 3D canvas at all times
   - The 3D canvas sits behind as atmospheric — like Noomo's approach where 3D is mood, not fighting text
3. **Fix line spacing:** Add proper `gap` or `leading` between the opening words so they never collide even during the scatter animation
4. **Tighten the scatter animation:** The current scatter sends lines in alternating directions with rotation — this causes the overlap. Reduce the extreme transforms and make lines fade out earlier before the verb sequence starts

**Proposed Hero Copy (for review):**
```
Opening (stacked, one per line):
  "EVERY YEAR"
  "GOVERNMENTS"
  "BET ON STARTUPS"
  "WITHOUT"
  "EVIDENCE."

Verbs (scroll-cycled, one at a time):
  01/04 — "IDENTIFY."
  02/04 — "SIMULATE."
  03/04 — "PROVE."
  04/04 — "SCALE."
```

---

### Navbar — Deferred Visibility

#### [MODIFY] [Nav.tsx](file:///c:/Udyojak/frontend/src/components/navigation/Nav.tsx)

**Problem:** Navbar is visible from the start, overlapping the hero experience.

**Changes:**
1. Add a `hidden` state that keeps the navbar off-screen (`translateY: -100%`, `opacity: 0`) initially
2. The hero's scroll timeline will dispatch a signal (via the `IntroProvider` or a new shared state) when the hero animation reaches completion (~100% scroll progress)
3. On that signal, the navbar animates in from the top with a smooth `power3.out` ease
4. On sub-pages (not landing), the navbar shows immediately as before

#### [MODIFY] [IntroProvider.tsx](file:///c:/Udyojak/frontend/src/components/motion/IntroProvider.tsx)

Add a new phase/state: `heroComplete` boolean that the Hero section sets when its scroll animation finishes. The Nav reads this to know when to reveal itself.

#### [MODIFY] [Hero.tsx](file:///c:/Udyojak/frontend/src/components/sections/Hero.tsx)

Add a callback in the ScrollTrigger `onUpdate` or `onLeave` to signal hero completion to the IntroProvider.

---

### Text Overlap Fix — Root Cause

#### [MODIFY] [globals.css](file:///c:/Udyojak/frontend/src/app/globals.css)

The `.line-mask` utility uses `overflow: hidden` with a small `padding-bottom` for descenders. This is fine in isolation, but during the GSAP scatter animation, the combination of `xPercent`, `yPercent`, `rotate`, and `scale` transforms makes lines visually collide because:
- Lines have no minimum separation enforced during animation
- The overflow hidden masks can clip neighboring lines

**Fix:** Add a minimum `margin-bottom` to `.line-mask` inside the hero context, and ensure the scatter animation uses `position: absolute` per-line with calculated non-overlapping destinations.

---

### 3D Layer Fix

#### [MODIFY] [Hero.tsx](file:///c:/Udyojak/frontend/src/components/sections/Hero.tsx)

Currently the 3D canvas is at `z-[2]` sandwiched between text at `z-1` and `z-3`. This sandwich approach causes visual collision.

**Fix:** Move 3D canvas to `z-[1]` (fully behind text). Text always at `z-[3]` or higher. The 3D becomes atmospheric backdrop — following the Noomo pattern where 3D enhances mood without fighting typography.

---

## Verification Plan

### Manual Verification
- Run `npm run dev` and test the hero scroll on localhost
- Verify no text overlap at any point during the scroll animation
- Verify navbar is hidden during hero, appears only after hero scroll completes
- Verify the hero copy is specific to the PS and not generic
- Verify sub-pages still show the navbar immediately
- Test on different viewport sizes (mobile, tablet, desktop)

### Browser Testing
- Use the browser tool to capture screenshots at key scroll positions:
  1. Initial load (hero visible, navbar hidden)
  2. Mid-scroll (text scatter, no overlap)
  3. Verb sequence (clean, one at a time)
  4. Post-hero (navbar appears)
