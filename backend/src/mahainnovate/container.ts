import { InMemoryPilotCorpus } from './corpus/pilotCorpus.repository';
import { PILOT_CORPUS_SEED } from './corpus/seed';
import { RetrievalService } from './retrieval/retrieval.service';
import { SimulatorService } from './simulator/simulator.service';
import { PolicyRagService } from './rag/rag.service';
import { InMemoryLedgerRepository, LedgerService } from './ledger/ledger.service';
import { FeedbackService } from './feedback/feedback.service';
import { LEDGER_SEED } from './ledger/seed';

/**
 * Composition root.
 *
 * Every dependency is wired once, here, and nothing below constructs its own
 * collaborators. The storage implementations are the only things that change
 * when the database arrives: swap `InMemoryPilotCorpus` and
 * `InMemoryLedgerRepository` for Prisma-backed classes and no service, engine or
 * route is touched.
 *
 * Deliberately module-level singletons. The in-memory stores hold writes for the
 * process lifetime, so constructing a fresh container per request would silently
 * discard every closed pilot and every approved milestone.
 */

const pilotCorpus = new InMemoryPilotCorpus(PILOT_CORPUS_SEED);
const ledgerRepository = new InMemoryLedgerRepository(LEDGER_SEED);

const retrieval = new RetrievalService(pilotCorpus);

export const services = {
  corpus: pilotCorpus,
  retrieval,
  simulator: new SimulatorService(retrieval),
  rag: new PolicyRagService(),
  ledger: new LedgerService(ledgerRepository),
  feedback: new FeedbackService(pilotCorpus),
};

export type Services = typeof services;
