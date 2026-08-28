import { PolicyClause, RetrievalAnswer, RetrievedClause } from '../domain/types';

/**
 * Policy retrieval (BE-04).
 *
 * Answers eligibility, IP, security and contracting questions by **quoting the
 * clause**, never by asserting. The response separates three things that a
 * government-facing product must never blur:
 *
 *   clauses        the source text, returned unmodified
 *   analysis       generated synthesis, labelled as such
 *   decisionOwner  the human role that actually decides
 *
 * Retrieval is keyword-and-overlap scored rather than embedding-based. That is
 * a deliberate constraint for this stage: an officer must be able to see *why*
 * a clause was returned, and a cosine distance is not an explanation. A vector
 * index belongs here later as an additional recall path, with this scoring kept
 * as the explainable one.
 *
 * When nothing clears the floor the service says so — `unanswered: true` — and
 * returns no analysis at all. Producing prose with no clause behind it is the
 * one failure mode this whole design exists to prevent.
 */

/** DEMONSTRATION CORPUS — simulated clauses, real structure. */
export const POLICY_CORPUS: PolicyClause[] = [
  {
    id: 'SRC-P-014',
    kind: 'policy',
    title: 'Innovation Procurement Policy',
    reference: 'Clause 4.2 — Relaxation of prior turnover and experience',
    excerpt:
      'For challenges routed through the innovation pathway, prior turnover and prior supply experience conditions shall not be applied as qualifying criteria at the pilot stage.',
    keywords: ['turnover', 'experience', 'eligibility', 'qualify', 'pilot', 'startup', 'criteria'],
  },
  {
    id: 'SRC-E-007',
    kind: 'eligibility',
    title: 'Startup Eligibility Rules',
    reference: 'Rule 3(b) — Recognition and standing',
    excerpt:
      'An entity holding valid DPIIT recognition and no adverse compliance finding in the preceding 24 months is eligible to participate in a controlled pilot.',
    keywords: ['eligible', 'eligibility', 'dpiit', 'recognition', 'compliance', 'participate', 'startup'],
  },
  {
    id: 'SRC-A-021',
    kind: 'agreement',
    title: 'Standard Pilot Agreement',
    reference: 'Schedule II — Scope limitation',
    excerpt:
      'A controlled pilot is limited to the wards, depots or facilities named in Schedule I, and confers no right to supply beyond that scope.',
    keywords: ['scope', 'agreement', 'pilot', 'supply', 'limitation', 'schedule'],
  },
  {
    id: 'SRC-C-009',
    kind: 'cybersecurity',
    title: 'Departmental Cybersecurity Baseline',
    reference: 'Section 6 — Data residency and access',
    excerpt:
      'Operational data generated during a pilot shall be stored within state-controlled infrastructure, with role-based access logged and auditable.',
    keywords: ['data', 'residency', 'security', 'cybersecurity', 'access', 'storage', 'audit'],
  },
  {
    id: 'SRC-I-011',
    kind: 'ip-data',
    title: 'IP and Data Clauses',
    reference: 'Clause 9 — Background and foreground IP',
    excerpt:
      'Background IP remains with the originating party. Foreground IP created specifically under the pilot is jointly recorded, with a licence to the department for continued operational use.',
    keywords: ['ip', 'intellectual', 'property', 'foreground', 'background', 'licence', 'ownership'],
  },
  {
    id: 'SRC-V-002',
    kind: 'evaluation',
    title: 'Evaluation Framework',
    reference: 'Annexure A — Weighted criteria',
    excerpt:
      'Proposals are scored on technical capability, impact, feasibility, security, scalability and cost. Assisted analysis may inform the panel; the panel records the decision.',
    keywords: ['evaluation', 'scoring', 'criteria', 'panel', 'decision', 'weighted', 'assessment'],
  },
  {
    id: 'SRC-M-018',
    kind: 'policy',
    title: 'Milestone Contracting Standard',
    reference: 'Clause 11 — Payment against validated evidence',
    excerpt:
      'Each tranche is released only after the department validates the evidence named for that milestone. No tranche may be released in anticipation of delivery.',
    keywords: ['milestone', 'payment', 'tranche', 'evidence', 'release', 'validation', 'contract'],
  },
];

/** Words carrying no retrieval signal. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'can', 'this', 'that', 'in', 'on', 'for', 'to', 'of', 'and',
  'or', 'be', 'do', 'does', 'we', 'it', 'with', 'what', 'how', 'may', 'must', 'should', 'if',
]);

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Below this, a clause is not about the question. */
const RELEVANCE_FLOOR = 0.12;

export class PolicyRagService {
  constructor(private readonly corpus: PolicyClause[] = POLICY_CORPUS) {}

  /** Scores every clause against the question and returns those above the floor. */
  retrieve(question: string, limit = 3): RetrievedClause[] {
    const terms = tokenise(question);
    if (terms.length === 0) return [];

    return this.corpus
      .map((clause) => {
        const haystack = tokenise(`${clause.title} ${clause.excerpt}`);
        // Keyword hits are the strong signal; body overlap is corroboration.
        const keywordHits = terms.filter((t) => clause.keywords.includes(t)).length;
        const bodyHits = terms.filter((t) => haystack.includes(t)).length;
        const relevance = (keywordHits * 2 + bodyHits) / (terms.length * 3);
        return { ...clause, relevance: Number(relevance.toFixed(3)) };
      })
      .filter((c) => c.relevance >= RELEVANCE_FLOOR)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Answers a question from the corpus.
   *
   * The analysis is assembled from the retrieved clauses only. It is not
   * generated text dressed up with citations after the fact — it is a summary
   * of what the returned passages say, which is why it cannot drift from them.
   */
  answer(question: string, decisionOwner?: string): RetrievalAnswer {
    const clauses = this.retrieve(question);

    if (clauses.length === 0) {
      return {
        question,
        clauses: [],
        analysis: '',
        decisionOwner:
          decisionOwner ?? 'This question is not answered by the current policy corpus.',
        unanswered: true,
      };
    }

    const kinds = [...new Set(clauses.map((c) => c.kind))];
    const analysis =
      `On the retrieved ${clauses.length === 1 ? 'clause' : 'clauses'} — ` +
      clauses.map((c) => c.reference).join('; ') +
      ` — the position is governed by ${kinds.join(', ')} provisions. ` +
      'The passages above are the authority; this summary only points to them and adds nothing beyond what they state.';

    return {
      question,
      clauses,
      analysis,
      decisionOwner:
        decisionOwner ??
        'The determination rests with the department’s competent authority. This analysis is an aid to that determination and carries no authority of its own.',
      unanswered: false,
    };
  }
}
