import type { StageId } from './pathway';

/**
 * The seven standard templates the problem statement requires the mechanism to
 * provide.
 *
 *   "The mechanism should provide standard templates for problem statements,
 *    evaluation criteria, pilot agreements, data/IP clauses, cybersecurity,
 *    risk management and procurement pathways."
 *
 * A template is only standard if it is specific. A named heading with a blank
 * page under it is what departments already have, and it is why two departments
 * writing the same challenge produce documents that cannot be compared, scored
 * against each other, or reused. So each template here carries its actual
 * fields, the guidance that stops a field being filled in uselessly, and a
 * worked example drawn from the demonstration pilot.
 *
 * On legal citations: templates deliberately ask the department to record the
 * provision it is relying on rather than asserting one on its behalf. Rules
 * change, departments differ, and a template that hard-codes a stale clause
 * number is worse than one that forces the author to look it up. Where a
 * provision is named below it is named as the thing to confirm, not as settled
 * advice.
 */

export interface TemplateField {
  label: string;
  /** What a useful answer looks like — the part that stops a blank heading. */
  guidance: string;
  /** Worked example, from the demonstration pilot. */
  example: string;
  required: boolean;
}

export interface StandardTemplate {
  id: string;
  name: string;
  /** The template in the problem statement's own words. */
  psClause: string;
  stage: StageId;
  /** Who fills it in. */
  author: 'Department' | 'Startup' | 'Evaluation panel' | 'Independent validator';
  purpose: string;
  fields: TemplateField[];
  /** Terms carried into every instance, not negotiated per pilot. */
  standingClauses?: string[];
}

export const STANDARD_TEMPLATES: StandardTemplate[] = [
  /* ------------------------------------------------------------------ 01 */
  {
    id: 'TPL-01',
    name: 'Problem statement',
    psClause: 'Standard templates for problem statements',
    stage: 'identify',
    author: 'Department',
    purpose:
      'Turns an operational complaint into a challenge a startup can answer, and a result the department can later be held to.',
    fields: [
      {
        label: 'Outcome sought',
        guidance:
          'One sentence, stated as a change in the world rather than as a product. If it names a technology, it is a specification, not an outcome.',
        example: 'Reduce non-revenue water loss across three wards without excavating to find leaks.',
        required: true,
      },
      {
        label: 'Baseline, and how it was measured',
        guidance:
          'The current value, the instrument, and the period. A challenge without a baseline cannot be judged at the end, and every dispute at milestone stage traces back to this field being left vague.',
        example: '31% distribution loss, from PMC bulk-meter reconciliation, twelve months to March 2026.',
        required: true,
      },
      {
        label: 'Target and tolerance',
        guidance:
          'The value that counts as success and the band within which partial credit is earned. Two numbers, not one.',
        example: 'Loss below 24%; partial credit from 24% to 27%.',
        required: true,
      },
      {
        label: 'Metrics and who measures them',
        guidance:
          'Each metric with its owner. A metric measured by the supplier is a claim; name the department officer or third party who reads it.',
        example:
          'Distribution loss (PMC water audit cell); detection precision (independent excavation record).',
        required: true,
      },
      {
        label: 'Operating constraints',
        guidance:
          'What the solution must live inside: existing assets, staff availability, power, connectivity, working hours, seasonal windows.',
        example: 'No excavation for detection; must run on existing 100mm and above mains; monsoon window excluded.',
        required: true,
      },
      {
        label: 'Sponsoring officer and decision owner',
        guidance:
          'The named officer who can stop the pilot and the one who signs the scale decision. If these are unnamed, the pilot has no route to procurement.',
        example: 'Executive Engineer (Water), PMC — sponsor. Additional Municipal Commissioner — decision owner.',
        required: true,
      },
      {
        label: 'Budget envelope for the pilot',
        guidance:
          'The ceiling, stated before applications open. Publishing it filters out proposals that were never affordable and stops the pilot being scoped by whoever guessed lowest.',
        example: '₹15,00,000 across four milestones.',
        required: true,
      },
    ],
  },

  /* ------------------------------------------------------------------ 02 */
  {
    id: 'TPL-02',
    name: 'Evaluation criteria',
    psClause: 'Standard templates for evaluation criteria',
    stage: 'evaluate',
    author: 'Department',
    purpose:
      'Published with the challenge, before applications open, so a rejected startup can see what it was measured against.',
    fields: [
      {
        label: 'Weighted criteria',
        guidance:
          'Each criterion with its weight and what a top and bottom score look like. Weights are published; they are not set after the applications are read.',
        example:
          'Technical approach 30 · Evidence of prior deployment 20 · Team capability 15 · Cost realism 15 · Data and security posture 10 · Scale-up plausibility 10.',
        required: true,
      },
      {
        label: 'Eligibility gate',
        guidance:
          'Only what genuinely disqualifies. Record the provision the department is relying on for any relaxation of prior-turnover or prior-experience conditions for recognised startups, and confirm it is current with the finance cell before publishing.',
        example:
          'DPIIT-recognised startup; no prior-turnover or prior-experience condition at pilot stage; relaxation basis recorded and confirmed on 2026-02-11.',
        required: true,
      },
      {
        label: 'Panel composition',
        guidance:
          'Names and roles, including at least one member independent of the sponsoring department, and the conflict-of-interest declaration each has signed.',
        example:
          'Executive Engineer (Water); Head of IT (PMC); external — professor of civil engineering, COEP. Declarations filed 2026-02-18.',
        required: true,
      },
      {
        label: 'Scoring record',
        guidance:
          'Per-criterion score per applicant with a one-line reason. The reason is what turns a score into feedback the startup can act on next time.',
        example: 'Filed per applicant against each of the six criteria.',
        required: true,
      },
      {
        label: 'Feedback to unsuccessful applicants',
        guidance:
          'The two lowest-scoring criteria and their reasons, released to each unsuccessful applicant. This is the difference between a market that learns and one that stops applying.',
        example: 'Released within ten working days of the panel decision.',
        required: true,
      },
    ],
    standingClauses: [
      'Criteria and weights are published with the challenge and are not altered after applications open.',
      'A panel member who has any interest in an applicant recuses from that applicant entirely, and the recusal is recorded.',
      'Every unsuccessful applicant receives its scores and reasons.',
    ],
  },

  /* ------------------------------------------------------------------ 03 */
  {
    id: 'TPL-03',
    name: 'Pilot agreement',
    psClause: 'Standard templates for pilot agreements',
    stage: 'design',
    author: 'Department',
    purpose:
      'The bounded contract for a controlled deployment: what is being tried, for how long, at whose risk, and how it ends.',
    fields: [
      {
        label: 'Scope and boundary',
        guidance:
          'What is in, and — the field that actually prevents disputes — what is explicitly out.',
        example:
          'In: three wards, mains 100mm and above. Out: household connections, billing system integration, any excavation.',
        required: true,
      },
      {
        label: 'Duration and extension',
        guidance:
          'Start, end, and the single named condition under which an extension is possible. Open-ended pilots are how a department ends up procuring by default.',
        example: '120 days from installation sign-off. One 30-day extension, only for monsoon access loss.',
        required: true,
      },
      {
        label: 'Milestones, evidence and payment',
        guidance:
          'Each milestone with the artefacts that unlock it and the sum released. Evidence is listed before the pilot starts, never agreed at the point of claiming.',
        example:
          'M1 Deploy ₹3,00,000 · M2 Collect ₹4,00,000 · M3 Validate ₹4,00,000 · M4 Report ₹4,00,000.',
        required: true,
      },
      {
        label: 'Exit conditions',
        guidance:
          'The circumstances in which either side can stop, the notice required, and what is paid for work already accepted.',
        example:
          'Department may stop on 14 days notice for safety or service risk; milestones already approved are paid in full.',
        required: true,
      },
      {
        label: 'Liability and insurance',
        guidance:
          'Capped, and proportionate to a pilot rather than to a production contract. An uncapped indemnity is the clause that keeps startups out.',
        example: 'Liability capped at contract value. Public liability cover of ₹50,00,000 for the pilot period.',
        required: true,
      },
      {
        label: 'Department obligations',
        guidance:
          'Site access, data supply, staff time and approvals, each with a date. Most pilot delays are departmental, and are invisible unless this field exists.',
        example:
          'Ward access within 7 days of signature; twelve months of bulk-meter data within 14 days; one engineer, two days per month.',
        required: true,
      },
    ],
    standingClauses: [
      'A pilot creates no obligation to procure, and confers no advantage in any subsequent tender beyond the validated evidence itself.',
      'Milestone payment follows validated evidence. There is no advance and no payment against invoice alone.',
      'Either party may terminate on the stated notice; approved milestones remain payable.',
    ],
  },

  /* ------------------------------------------------------------------ 04 */
  {
    id: 'TPL-04',
    name: 'Data and IP clauses',
    psClause: 'Standard templates for data/IP clauses',
    stage: 'design',
    author: 'Department',
    purpose:
      'Settles ownership before day one. Left to the end of a pilot, this is the clause that strands a successful result in a dispute.',
    fields: [
      {
        label: 'Background IP',
        guidance:
          'What each side brings and keeps. A department that claims a startup’s pre-existing model gets no applicants; say so explicitly.',
        example: 'Startup retains its detection models and firmware. Department retains its network and asset data.',
        required: true,
      },
      {
        label: 'Foreground IP',
        guidance:
          'What is created during the pilot, who owns it, and the licence flowing the other way. State the licence terms, not just the ownership.',
        example:
          'Startup owns improvements to its models. Department receives a perpetual, irrevocable, royalty-free licence to use outputs for its own operations across departments and districts.',
        required: true,
      },
      {
        label: 'Government data supplied',
        guidance:
          'What is shared, at what granularity, for what purpose, and for how long it may be retained after the pilot ends.',
        example:
          'Ward-level flow and pressure telemetry, pseudonymised; used solely for this pilot; deleted or returned within 30 days of closure.',
        required: true,
      },
      {
        label: 'Data generated during the pilot',
        guidance:
          'Sensor readings, labels, annotations and derived datasets. Say whether the startup may use them to train models beyond this pilot — the answer is a negotiation, not a default.',
        example:
          'Jointly held. Startup may use de-identified readings for model improvement; raw ward-level data may not leave state-hosted infrastructure.',
        required: true,
      },
      {
        label: 'Personal data',
        guidance:
          'Whether any is processed at all. If yes, name the lawful basis, the retention period and the deletion mechanism, and have the department’s data protection contact sign this field.',
        example: 'No personal data processed. Complaint records are aggregated to ward level before sharing.',
        required: true,
      },
      {
        label: 'Publication',
        guidance:
          'Whether either side may publish results, with what notice and what redaction. Silence here means neither the department nor the startup can talk about a success.',
        example:
          'Either party may publish outcome metrics after 30 days notice; network topology and node locations are redacted.',
        required: true,
      },
    ],
    standingClauses: [
      'Government data is supplied for the pilot purpose only and is not sublicensed.',
      'The department’s licence to pilot outputs survives termination and extends to other departments and districts.',
      'Data leaving state-hosted infrastructure requires prior written approval, recorded against this agreement.',
    ],
  },

  /* ------------------------------------------------------------------ 05 */
  {
    id: 'TPL-05',
    name: 'Cybersecurity requirements',
    psClause: 'Standard templates for cybersecurity',
    stage: 'design',
    author: 'Department',
    purpose:
      'Proportionate security for a bounded pilot: enough that a breach is survivable, not so much that only incumbents can comply.',
    fields: [
      {
        label: 'Hosting and data residency',
        guidance:
          'Where the workload and the data physically sit. Name the environment, not the vendor.',
        example: 'State data centre or MeghRaj-empanelled cloud, India region only. No processing outside India.',
        required: true,
      },
      {
        label: 'Access control',
        guidance:
          'Who can reach production data, how they authenticate, and how access is removed when someone leaves.',
        example:
          'Role-based access, named accounts only, multi-factor for administrators, removal within 24 hours of exit.',
        required: true,
      },
      {
        label: 'Logging and retention',
        guidance:
          'What is logged, where logs are held, and for how long. Confirm the current CERT-In direction on log retention with the department IT cell before fixing the period — the 2022 directions set 180 days, and this is the field where a stale number does real harm.',
        example: 'Authentication, data access and configuration changes logged; retained 180 days; held in India.',
        required: true,
      },
      {
        label: 'Incident reporting',
        guidance:
          'The window within which the startup must notify the department, and the named contact. Confirm the current CERT-In reporting window; the 2022 directions set six hours for listed incident types.',
        example:
          'Notify the department IT cell within six hours of becoming aware; written report within five working days.',
        required: true,
      },
      {
        label: 'Assurance appropriate to the pilot',
        guidance:
          'What the startup must actually produce. A pilot should not demand a full certification a six-person company cannot hold — ask for a current VAPT report against the deployed build.',
        example:
          'VAPT report against the deployed build, no open critical or high findings, dated within 90 days of go-live.',
        required: true,
      },
      {
        label: 'Exit and destruction',
        guidance: 'What happens to credentials, keys, data and devices when the pilot ends.',
        example:
          'Credentials revoked within 24 hours of closure; data deleted or returned within 30 days; deletion certificate filed.',
        required: true,
      },
    ],
    standingClauses: [
      'Security requirements are proportionate to a bounded pilot and are re-set, upward, before any scale-up award.',
      'A certification the startup does not need in order to run this pilot safely is not a condition of entry.',
      'Statutory reporting windows and retention periods are confirmed as current by the department IT cell before the agreement is issued.',
    ],
  },

  /* ------------------------------------------------------------------ 06 */
  {
    id: 'TPL-06',
    name: 'Risk management plan',
    psClause: 'Standard templates for risk management',
    stage: 'scale',
    author: 'Department',
    purpose:
      'Converts the failure modes of comparable pilots into preconditions that must hold before this one is awarded.',
    fields: [
      {
        label: 'Risk, drawn from prior pilots',
        guidance:
          'Each risk cited to the pilot ids it was observed in. A risk register written from imagination lists what is easy to imagine, not what actually goes wrong.',
        example:
          'Baseline too short to separate signal from seasonal variation — observed in PL-2208, PL-2214, PL-2301.',
        required: true,
      },
      {
        label: 'Severity and frequency',
        guidance:
          'How often it occurred in the corpus and what it cost when it did. Frequency is counted, not estimated.',
        example: 'Occurred in 3 of 6 comparable water-distribution pilots; caused two milestone failures.',
        required: true,
      },
      {
        label: 'Precondition',
        guidance:
          'The contractual term that removes the risk, written so compliance is checkable before award rather than argued afterwards.',
        example: 'Baseline period fixed at 30 days minimum and written into M2 evidence requirements.',
        required: true,
      },
      {
        label: 'Owner and check date',
        guidance: 'Who confirms the precondition holds, and when they confirm it.',
        example: 'Executive Engineer (Water), at contract signature and again at M2 evidence review.',
        required: true,
      },
      {
        label: 'Residual risk accepted',
        guidance:
          'What remains after the preconditions, stated plainly and signed by the decision owner. A register with no residual risk has not been read.',
        example:
          'Monsoon access loss cannot be fully mitigated; accepted, with one 30-day extension available.',
        required: true,
      },
    ],
    standingClauses: [
      'Every risk cites the pilot records it was observed in. An uncited risk is a suggestion, not a register entry.',
      'A precondition that cannot be checked before award is not a precondition.',
    ],
  },

  /* ------------------------------------------------------------------ 07 */
  {
    id: 'TPL-07',
    name: 'Procurement pathway note',
    psClause: 'Standard templates for procurement pathways',
    stage: 'scale',
    author: 'Department',
    purpose:
      'The route from a validated pilot to a compliant award, recorded with the evidence it rests on. This is the field that decides whether a successful pilot becomes anything at all.',
    fields: [
      {
        label: 'Decision',
        guidance: 'Scale, extend, or stop. Recorded even when the decision is to stop — especially then.',
        example: 'Scale to eleven further wards.',
        required: true,
      },
      {
        label: 'Evidence relied on',
        guidance:
          'The validated milestone reports and metrics behind the decision, by reference. A decision whose evidence cannot be listed will not survive audit.',
        example: 'Independent validation report VAL-3311-04; metrics against baseline and target.',
        required: true,
      },
      {
        label: 'Procurement route and its basis',
        guidance:
          'The route chosen and the provision permitting it. Record the rule the department is relying on and the date the finance cell confirmed it — do not carry a clause number forward from a previous note without re-checking it.',
        example:
          'Listing and award through the Government e-Marketplace; basis recorded and confirmed with the finance cell on 2026-07-02.',
        required: true,
      },
      {
        label: 'Value and duration of the proposed award',
        guidance: 'What is actually being bought, over what period, against which budget line.',
        example: '₹1,80,00,000 over 24 months, municipal water infrastructure head.',
        required: true,
      },
      {
        label: 'Transferability to other departments',
        guidance:
          'Whether the validated evidence can be relied on elsewhere without re-running the pilot, and what a second department would still need to check.',
        example:
          'Evidence transferable to other municipal corporations on similar network age; each should confirm pipe material mix before adoption.',
        required: true,
      },
      {
        label: 'Decision owner and date',
        guidance: 'The named officer who signed, and when. Not the department — the officer.',
        example: 'Additional Municipal Commissioner, 2026-07-14.',
        required: true,
      },
    ],
    standingClauses: [
      'A stop decision is recorded with the same completeness as a scale decision; the corpus needs both.',
      'The procurement route and its enabling provision are confirmed as current at the time of the note.',
    ],
  },
];

/**
 * Integration surfaces the problem statement names as optional.
 *
 *   "It may integrate with recognised startup databases and government
 *    e-marketplaces."
 *
 * Recorded here as an interface contract rather than as a live connection: the
 * mechanism is designed so these are adapters at two named points, not a
 * dependency the pathway would collapse without. A department without either
 * still has a working mechanism — it just does discovery and award by hand.
 */
export interface IntegrationSurface {
  id: string;
  name: string;
  stage: StageId;
  /** What the mechanism asks of it. */
  contract: string;
  /** What the mechanism does when it is absent. */
  fallback: string;
  status: 'interface defined' | 'connected';
}

export const INTEGRATION_SURFACES: IntegrationSurface[] = [
  {
    id: 'INT-01',
    name: 'Recognised startup databases',
    stage: 'discover',
    contract:
      'Given a challenge domain, return candidate recognised startups with their recognition reference, so discovery is a search rather than a tender notice — and so eligibility screening can cite a recognition rather than assert one.',
    fallback:
      'The department enters recognition references manually at screening. Discovery reverts to a published open call.',
    status: 'interface defined',
  },
  {
    id: 'INT-02',
    name: 'Government e-marketplace',
    stage: 'scale',
    contract:
      'Given a scale decision and its validation evidence, carry the award to a listing on the marketplace, so the pathway ends inside an existing compliant route rather than inventing a new one.',
    fallback:
      'The procurement pathway note records the chosen route and the department proceeds through its ordinary process.',
    status: 'interface defined',
  },
];
