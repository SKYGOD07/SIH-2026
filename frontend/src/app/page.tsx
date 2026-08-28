import {
  Hero,
  ProblemSection,
  PathwaySection,
  SimulatorSection,
  EvidenceSection,
  OutcomeSection,
  BackendPlanSection,
  FinaleSection,
} from '@/components/sections';

/**
 * The landing story.
 *
 * Eight sections, one argument:
 *
 *   problem -> the mechanism -> the simulator -> evidence -> outcome -> next
 *
 * The simulator is the centre. Everything before it establishes why a pilot
 * needs designing from evidence; everything after shows what that produces.
 *
 * Only the hero, the evidence sequence and the finale pin. An earlier build
 * pinned fourteen sections across twenty screens, which made the page long
 * without making the argument clearer.
 */
export default function LandingPage() {
  return (
    <>
      {/* why the pathway is needed */}
      <Hero />
      <ProblemSection />

      {/* the compliant end-to-end mechanism the PS asks for */}
      <PathwaySection />

      {/* our addition: design the pilot from evidence before funding it */}
      <SimulatorSection />

      {/* how any conclusion is grounded, and who decides */}
      <EvidenceSection />

      {/* contract, measure, pay, validate, scale */}
      <OutcomeSection />

      {/* honest scope, and the services still to build */}
      <BackendPlanSection />
      <FinaleSection />
    </>
  );
}
