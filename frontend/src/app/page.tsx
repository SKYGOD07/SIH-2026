import { LandingDeck } from '@/components/deck';

/**
 * The landing page.
 *
 * One deck, read sideways. Vertical scroll is pinned and spent travelling
 * across eight full-viewport slides: the pathway, the problem, the idea, the
 * mechanism, what is built, what it does, what it refuses, and the way in.
 *
 * The earlier vertical build is gone. Its detail was not so much deleted as
 * relocated — the pathway stages live on the product routes and the simulator
 * output lives in the API and the dashboard, which is where a reader who wants
 * that level of detail is already heading.
 */
export default function LandingPage() {
  return <LandingDeck />;
}
