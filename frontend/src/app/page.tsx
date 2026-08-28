import {
  Hero,
  ProblemSection,
  PathwaySection,
  IdeaSlide,
  BuiltSlide,
  CapabilitySlide,
  FinaleSection,
} from '@/components/sections';

/**
 * The landing story.
 *
 *   problem -> the mechanism -> the idea -> what is built -> what it does
 *
 * Deliberately short. The reference this is modelled on carries 274 words
 * across its whole page, about 23 to a screen; an earlier version of this page
 * carried 873 across 24 screens, with one section alone holding more text than
 * the entire reference site.
 *
 * Detail did not get deleted, it got moved: the pathway detail lives on the
 * product routes, and the simulator output lives in the API and the dashboard,
 * which is where a reader who wants it is actually going.
 */
export default function LandingPage() {
  return (
    <>
      {/* why the pathway is needed */}
      <Hero />
      <ProblemSection />

      {/* the compliant end-to-end mechanism the PS asks for */}
      <PathwaySection />

      {/* the three slides: idea, built, capability */}
      <IdeaSlide />
      <BuiltSlide />
      <CapabilitySlide />

      <FinaleSection />
    </>
  );
}
