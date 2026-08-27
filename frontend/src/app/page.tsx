import { ScrollProgress } from '@/components/navigation/ScrollProgress';
import {
  Hero,
  ProblemStatement,
  LifecycleSection,
  DefineSection,
  DiscoverSection,
  StartupProfileSection,
  EvidenceSection,
  EvaluationSection,
  PilotSection,
  MilestonePaymentSection,
  KpiSection,
  DecisionSection,
  ScaleSection,
  KnowledgeGraphSection,
  FailureSection,
  LivePreviewSection,
  ModeSection,
  FinaleSection,
} from '@/components/sections';

/**
 * The landing story.
 *
 * The order is the argument, and it is the same order the product enforces:
 *
 *   problem → define → discover → verify → evaluate → pilot → measure →
 *   procure → scale → learn
 *
 * Each section owns its own scroll choreography; this file only sequences them.
 * Sections that pin are interleaved with sections that scroll normally, so the
 * page never feels like an unbroken run of hijacked scroll.
 */
export default function LandingPage() {
  return (
    <>
      <ScrollProgress />

      {/* the problem */}
      <Hero />
      <ProblemStatement />
      <LifecycleSection />

      {/* the pathway, stage by stage */}
      <DefineSection />
      <DiscoverSection />
      <StartupProfileSection />
      <EvidenceSection />
      <EvaluationSection />
      <PilotSection />
      <MilestonePaymentSection />
      <KpiSection />
      <DecisionSection />
      <ScaleSection />

      {/* what the pathway leaves behind */}
      <KnowledgeGraphSection />
      <FailureSection />

      {/* the product underneath */}
      <LivePreviewSection />
      <ModeSection />
      <FinaleSection />
    </>
  );
}
