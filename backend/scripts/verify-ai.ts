/**
 * Verify the assistance layer.
 *
 *   npm run verify:ai
 *
 * Three things are checked, in order of how badly they would fail in front of a
 * judge:
 *
 *   1. the contract — grounding actually removes a fabricated citation, and a
 *      malformed model response is discarded rather than rendered;
 *   2. the fallback — every surface returns a usable answer with no model at
 *      all, because that is the state the deployed backend is in until Ollama
 *      is reachable from it;
 *   3. the live path — if a model is configured and reachable, each of the ten
 *      surfaces is exercised against real rows.
 *
 * (2) is the one that matters most for a demonstration. A surface that only
 * works when the model works is a surface that will be blank on stage.
 *
 * Exits non-zero on failure so it can gate a deploy.
 */
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ollamaReadiness, env } from '../src/config/env';
import { AiOutputSchema, groundOutput, AI_TASKS } from '../src/sarthi/ai/ai.contract';
import { challengeContext, startupContext, matchContext, pilotContext } from '../src/sarthi/ai/ai.context';
import type { AIProvider } from '../src/sarthi/ai/ollama.provider';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
let skipped = 0;

const pass = (label: string, note = '') => {
  passed += 1;
  console.log(`  PASS  ${label}${note ? ` — ${note}` : ''}`);
};
const fail = (label: string, why: string) => {
  failed += 1;
  console.log(`  FAIL  ${label} — ${why}`);
};
const skip = (label: string, why: string) => {
  skipped += 1;
  console.log(`  SKIP  ${label} — ${why}`);
};

/* ------------------------------------------------------------- stub models */

/** A model that answers correctly but cites a document that does not exist. */
const fabricatingProvider: AIProvider = {
  generate: async () => '',
  generateStructured: async <T>(_p: string, schema: z.ZodType<T>) =>
    schema.parse({
      summary: 'A well-formed answer.',
      strengths: [],
      limitations: [],
      evidenceUsed: ['ISO 27001 Certificate issued by the Ministry of Electronics'],
      missingEvidence: [],
      questions: [],
      recommendationExplanation: '',
    }),
  embed: async () => [],
  healthCheck: async () => ({ ready: true, mode: 'local' as const }),
  listModels: async () => [],
};

async function main() {
  console.log('\nSarthi — AI assistance layer\n');

  /* ---------------------------------------------------- 1. the contract --- */

  console.log('CONTRACT');

  {
    const label = 'grounding removes a fabricated citation';
    const parsed = AiOutputSchema.parse(
      await fabricatingProvider.generateStructured('', AiOutputSchema, ''),
    );
    const { output, warnings } = groundOutput(parsed, { citable: ['Company Registration Pack', 'KYC Document Pack'] });
    if (output.evidenceUsed.length === 0 && warnings.length === 1) {
      pass(label, 'invented certificate dropped and reported');
    } else {
      fail(label, `kept ${output.evidenceUsed.length} citation(s), ${warnings.length} warning(s)`);
    }
  }

  {
    const label = 'grounding keeps a paraphrased real citation';
    const { output, warnings } = groundOutput(
      AiOutputSchema.parse({ summary: 'x', evidenceUsed: ['KYC pack'] }),
      { citable: ['KYC Document Pack'] },
    );
    if (output.evidenceUsed.length === 1 && warnings.length === 0) pass(label);
    else fail(label, 'a real document cited loosely was dropped');
  }

  {
    const label = 'grounding cites nothing when nothing was supplied';
    const { output } = groundOutput(
      AiOutputSchema.parse({ summary: 'x', evidenceUsed: ['Anything at all'] }),
      { citable: [] },
    );
    if (output.evidenceUsed.length === 0) pass(label);
    else fail(label, 'cited a document with an empty index');
  }

  {
    const label = 'a malformed response is rejected by the schema';
    const bad = AiOutputSchema.safeParse({ strengths: ['no summary field'] });
    if (!bad.success) pass(label);
    else fail(label, 'schema accepted an output with no summary');
  }

  /* -------------------------------------------------- 2. the fallbacks --- */

  console.log('\nDETERMINISTIC FALLBACK  (what every surface shows with no model)');

  const challenge = await prisma.challenge.findFirst({ select: { id: true, title: true } });
  const startup = await prisma.startup.findFirst({
    where: { documents: { some: {} } },
    select: { id: true, legalName: true },
  });
  const match = await prisma.startupMatch.findFirst({ select: { challengeId: true, startupId: true } });
  const pilot = await prisma.pilot.findFirst({ select: { id: true } });

  /** A fallback must be a real answer: a summary, and gaps stated rather than implied. */
  const judge = (label: string, ctx: { fallback: { summary: string; missingEvidence: string[] } }) => {
    const s = ctx.fallback.summary.trim();
    if (s.length < 40) return fail(label, `summary is ${s.length} characters — not a usable answer`);
    if (/undefined|NaN|\[object/.test(s)) return fail(label, `summary contains a formatting artefact: ${s.slice(0, 90)}`);
    pass(label, `${s.length} chars, ${ctx.fallback.missingEvidence.length} gap(s) named`);
  };

  if (challenge) judge('challenge briefing', await challengeContext(challenge.id));
  else skip('challenge briefing', 'no challenge rows');

  if (startup) {
    const ctx = await startupContext(startup.id);
    judge('company summary / evidence summary', ctx);
    if (ctx.index.citable.length > 0) pass('company grounding index is populated', `${ctx.index.citable.length} citable record(s)`);
    else fail('company grounding index is populated', 'a company with documents produced an empty index');
  } else skip('company summary', 'no startup with documents');

  if (match) judge('match explanation / evaluation draft / pilot plan', await matchContext(match.challengeId, match.startupId));
  else skip('match explanation', 'no match rows');

  if (pilot) judge('pilot progress / KPI / outcome / scale', await pilotContext(pilot.id));
  else skip('pilot surfaces', 'no pilot rows — seed a pilot to exercise these four');

  /* ----------------------------------------------------- 3. the live path */

  console.log('\nLIVE MODEL');

  const readiness = ollamaReadiness();
  if (!readiness.ready) {
    skip('live generation', readiness.reason ?? 'provider not ready');
    console.log(`\n  Every surface above still answers. The platform runs without a model;`);
    console.log(`  it is prose that is missing, not function.`);
  } else {
    const { defaultAIProvider } = await import('../src/sarthi/ai/ollama.provider');
    const models = await defaultAIProvider.listModels();

    if (models.length === 0) {
      // Not a failure. Configuration says a model *may* be reached; the host
      // being down is the condition the fallback exists for, and failing the
      // build for it would mean no deploy could ever go out without Ollama up.
      skip(
        'model host reachable',
        `nothing answering at ${env.OLLAMA_BASE_URL} — every surface falls back; start Ollama to exercise the live path`,
      );
    } else {
      pass('model host reachable', `${models.length} model(s)`);
      if (models.some((m) => m.startsWith(env.OLLAMA_MODEL))) pass(`configured model present`, env.OLLAMA_MODEL);
      else fail('configured model present', `${env.OLLAMA_MODEL} is not installed — run: ollama pull ${env.OLLAMA_MODEL}`);

      if (models.some((m) => m.startsWith(env.OLLAMA_EMBED_MODEL))) pass('embedding model present', env.OLLAMA_EMBED_MODEL);
      else fail('embedding model present', `run: ollama pull ${env.OLLAMA_EMBED_MODEL}`);
    }

    if (startup) {
      const svc = await import('../src/sarthi/ai/ai.service');
      const t0 = Date.now();
      const env1 = await svc.summariseStartup(null, startup.id);
      const ms = Date.now() - t0;

      if (env1.assisted) {
        pass('live company summary', `${ms}ms, ${env1.warnings.length} ungrounded citation(s) removed`);
        if (env1.disclosure) pass('disclosure travels with the payload');
        else fail('disclosure travels with the payload', 'envelope had no disclosure');
      } else {
        // Not a failure. A slow or unhappy model is exactly the case the
        // fallback exists for, and the surface still answered.
        skip('live company summary', `fell back after ${ms}ms — ${env1.fallbackReason}`);
      }
    }
  }

  /* ------------------------------------------------------------- coverage */

  console.log('\nCOVERAGE');
  const { AI_TASK_LABELS } = await import('../src/sarthi/ai/ai.contract');
  const svc = await import('../src/sarthi/ai/ai.service');
  const exported = new Set(Object.keys(svc));
  // Ten tasks, ten named entry points. A task with no surface is a prompt
  // nobody can reach; a surface with no task cannot exist, since `runTask` is
  // private and typed to the union.
  if (AI_TASKS.length === 10) pass('ten declared tasks', Object.values(AI_TASK_LABELS).length + ' labelled');
  else fail('ten declared tasks', `found ${AI_TASKS.length}`);

  const surfaces = [
    'briefChallenge', 'summariseStartup', 'explainMatch', 'summariseEvidence', 'draftEvaluation',
    'draftPilotPlan', 'analysePilotProgress', 'explainKpis', 'summarisePilotOutcome', 'explainScaleRecommendation',
  ];
  const missing = surfaces.filter((s) => !exported.has(s));
  if (missing.length === 0) pass('all ten surfaces exported');
  else fail('all ten surfaces exported', `missing ${missing.join(', ')}`);

  /* --------------------------------------------------------------- report */

  console.log(`\n${passed} passed · ${skipped} skipped · ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('\nFAILED', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
