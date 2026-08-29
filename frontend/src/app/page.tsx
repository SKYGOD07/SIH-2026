import { LandingDeck } from '@/components/deck';
import { MarqueeBand } from '@/components/marquee';

/**
 * The band between the deck and the footer.
 *
 * Six words, which are the four verbs the problem statement names plus the two
 * commitments the mechanism actually makes. It earns its place as the hinge in
 * the page: the deck ends black, the footer is red, and a tilted white ribbon
 * is what turns that from a collision into a transition.
 */
const TICKER = [
  'Identify',
  'Pilot',
  'Procure',
  'Scale',
  'Evidence first',
  'Paid on proof',
];

/**
 * The landing page.
 *
 * One deck read sideways, then a ticker band. Vertical scroll is pinned and
 * spent travelling across nine full-viewport slides, all of them answering one
 * question: which startup should we test for this problem.
 *
 * Detail was relocated rather than deleted — the pathway stages and the
 * standard templates live on the console routes, which is where a reader who
 * wants that level of detail is already heading.
 */
export default function LandingPage() {
  return (
    <>
      <LandingDeck />
      <MarqueeBand items={TICKER} label="Identify, pilot, procure, scale. Evidence first, paid on proof." />
    </>
  );
}
