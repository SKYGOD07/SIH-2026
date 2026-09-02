import type { Metadata } from 'next';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { SectionHead, Card } from '@/components/console/primitives';
import { Icon, type IconName } from '@/components/console/Icon';
import { AIAssistancePanel } from '@/components/console/AIAssistancePanel';
import { SessionSettingsCard } from '@/components/console/SessionSettingsCard';
import { RoleGate } from '@/components/console/RoleGate';
import { fetchDashboard } from '@/lib/api/sarthi';
import { buildRailContext } from '@/lib/console/rail';
import { STANDARD_TEMPLATES } from '@/data/templates';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Your account, the AI assistant, what the console notifies you about, and the standards it enforces.',
};

export const dynamic = 'force-dynamic';

/**
 * Settings.
 *
 * Ordered by who needs it. An officer's account and the assistant come first,
 * then what the console will tell them about, then the rules it applies to
 * their documents. The engineering constants that used to open this page —
 * similarity floors, storage strategy, the file a threshold lives in — are last
 * and behind a role gate, because a threshold's source file is a fact about the
 * repository, not about procurement.
 *
 * Nothing here is a toggle that does not save. The platform stores no per-user
 * preferences yet, so the sections below state what the mechanism actually does
 * rather than offering a switch that would quietly do nothing — which is the
 * same rule the rest of this codebase applies to a pending fact.
 */

interface Standard {
  label: string;
  value: string;
  where: string;
  note: string;
  icon: IconName;
}

/** What the console raises, and on what trigger. Descriptions of real behaviour. */
const NOTIFICATIONS: { title: string; body: string; icon: IconName }[] = [
  {
    title: 'Evidence awaiting your review',
    body: 'A startup files evidence against a milestone or a KPI and it sits in SUBMITTED until somebody accepts or rejects it. It appears in your decision queue from the moment it is filed.',
    icon: 'file',
  },
  {
    title: 'Milestone due, and milestone overdue',
    body: 'Raised from the milestone due date against today. An overdue milestone stays raised until it is approved or rejected — it does not age out of the queue.',
    icon: 'clock',
  },
  {
    title: 'Payment released',
    body: 'Recorded when an approved milestone is paid. The ledger has no transition from filed evidence straight to paid, so this always follows an approval by a named person.',
    icon: 'rupee',
  },
  {
    title: 'Pilot awaiting validation',
    body: 'A pilot that has reached the end of its term with an unmeasured primary metric is surfaced rather than closed. An outcome cannot be recorded against a metric nobody measured.',
    icon: 'flask',
  },
];

/** The dossier the platform actually asks a company for. */
const REQUIRED_DOCUMENTS: { category: string; label: string; why: string }[] = [
  { category: 'CORPORATE_LEGAL', label: 'Corporate and legal', why: 'Incorporation and constitutional documents.' },
  { category: 'KYC', label: 'KYC', why: 'Identity of the entity the department would contract with.' },
  { category: 'FINANCIAL', label: 'Financial', why: 'Whether the company can carry a pilot to completion.' },
  { category: 'COMPLIANCE', label: 'Compliance', why: 'Statutory and sectoral obligations relevant to the deployment.' },
  { category: 'TECHNOLOGY', label: 'Technology', why: 'What is being deployed, and how it is secured.' },
  { category: 'PILOT', label: 'Pilot', why: 'Deployment plan, dependencies and support commitments.' },
];

export default async function SettingsPage() {
  const snapshot = await fetchDashboard();
  const rail = buildRailContext(snapshot, new Date());

  const standards: Standard[] = [
    {
      label: 'Payment standard',
      value: '15 days',
      where: 'Enforced in ledger service',
      note: 'Filed to paid. Our commitment, not a statutory figure — the problem statement asks for timely payment without naming a number, so the mechanism names one.',
      icon: 'clock',
    },
    {
      label: 'Reporting threshold',
      value: '4 pilots',
      where: 'Enforced in confidence calculation',
      note: 'Comparable pilots needed in a domain before a confidence ratio is reported as a finding rather than as context.',
      icon: 'corpus',
    },
    {
      label: 'Similarity floor',
      value: '0.45',
      where: 'Enforced in retrieval service',
      note: 'Below this a prior pilot is not comparable enough to inform a design, and is excluded rather than weighted down.',
      icon: 'target',
    },
    {
      label: 'Standard templates',
      value: `${STANDARD_TEMPLATES.length} issued`,
      where: 'Standardized templates engine',
      note: 'Fields, guidance and standing clauses. Changing a standing clause changes every document generated after it.',
      icon: 'templates',
    },
    {
      label: 'Data residency',
      value: 'India only',
      where: 'Standing security clause',
      note: 'State data centre or an empanelled cloud in an India region. Data leaving it needs written approval recorded against the pilot agreement.',
      icon: 'shield',
    },
    {
      label: 'Evidence completeness',
      value: 'Derived, 0–100',
      where: 'Derived metrics calculation',
      note: 'Profile 30, dossier 40, assurance 15, pilot readiness 15. Computed from the records on every read rather than stored, because a stored copy goes stale the moment a document is filed.',
      icon: 'trend',
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Settings"
        subtitle="Your account, the assistant, and the standards this console enforces"
        notifications={rail.notifications}
      />

      {/* --- 1. Account ------------------------------------------------- */}
      <section aria-label="Account">
        <SectionHead title="Account" meta="Identity, role and session" />
        <SessionSettingsCard />
      </section>

      {/* --- 2. AI assistance ------------------------------------------- */}
      <section aria-label="AI assistance">
        <SectionHead title="AI assistance" meta="Advisory only" />
        <AIAssistancePanel />
      </section>

      {/* --- 3. Notifications ------------------------------------------- */}
      <section aria-label="Notifications">
        <SectionHead title="Notifications" meta="What reaches your queue" />

        <Card className="p-0">
          <ul>
            {NOTIFICATIONS.map((n) => (
              <li
                key={n.title}
                className="flex gap-3.5 border-b border-chalk/[0.06] px-[1.125rem] py-4 last:border-b-0"
              >
                <span className="grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-[10px] tint-chalk">
                  <Icon name={n.icon} />
                </span>
                <div className="min-w-0">
                  <span className="text-[0.8125rem] font-semibold text-chalk">{n.title}</span>
                  <p className="mt-1.5 max-w-[70ch] text-[0.78125rem] leading-relaxed text-chalk/50">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <p className="mt-3 max-w-[68ch] text-[0.78125rem] leading-relaxed text-chalk/40">
          These are raised for every officer on the relevant pilot. Per-user notification preferences are
          not stored yet, and a switch that silently saved nothing would be worse than none — so the
          console states what it does instead of offering one.
        </p>
      </section>

      {/* --- 4. Documents and evidence ---------------------------------- */}
      <section aria-label="Documents and evidence">
        <SectionHead title="Documents and evidence" meta="What a complete dossier means" />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
              Required categories
            </span>
            <ul className="mt-3 space-y-2.5">
              {REQUIRED_DOCUMENTS.map((d) => (
                <li key={d.category} className="border-b border-chalk/[0.06] pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[0.8125rem] font-semibold text-chalk">{d.label}</span>
                    <code className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                      {d.category}
                    </code>
                  </div>
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-chalk/45">{d.why}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-chalk/40">
              A company&rsquo;s dossier score counts how many of these six are present. A missing category
              is reported as missing, never inferred from the others.
            </p>
          </Card>

          <Card>
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-chalk/40">
              How evidence is treated
            </span>
            <ul className="mt-3 space-y-3">
              {[
                ['Filed is not accepted', 'A submission enters at SUBMITTED and stays there until a reviewer accepts or rejects it. A startup’s own upload can never count as validation.'],
                ['Absent is not zero', 'An unmeasured KPI has no achieved value. It is shown as not yet measured, never as a zero, because a zero reads as "no improvement" when it means "nobody looked".'],
                ['Nothing verifies itself', 'VERIFIED is reserved for a claim backed by a cited evidence source. No onboarding form can set it.'],
                ['A rejection keeps its reason', 'The rejection note survives the milestone returning to an earlier state, so the trail does not lose why.'],
              ].map(([title, body]) => (
                <li key={title}>
                  <div className="flex items-center gap-2">
                    <Icon name="lock" className="h-3.5 w-3.5 shrink-0 text-chalk/30" />
                    <span className="text-[0.8125rem] font-semibold text-chalk">{title}</span>
                  </div>
                  <p className="mt-1 max-w-[60ch] text-[0.75rem] leading-relaxed text-chalk/45">{body}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* --- 5. Security ------------------------------------------------- */}
      <section aria-label="Security">
        <SectionHead title="Security" meta="How this console handles credentials" />

        <Card className="p-0">
          <ul>
            {[
              [
                'Authentication is Supabase Auth',
                'Sign-in, sign-up and password reset are handled by Supabase. This API verifies the access token and derives who you are from it — it never trusts a user id sent in a request body.',
              ],
              [
                'Your token travels in a header, never a cookie',
                'The API is not credentialed and its CORS policy matches, which makes the wildcard-origin-with-cookies mistake structurally impossible.',
              ],
              [
                'The browser never queries the database',
                'Every read and write goes through this API. The browser holds no database credential and no service key.',
              ],
              [
                'Model credentials stay in the backend',
                'The AI host credential is read only by the backend process. It is never returned by an endpoint, never logged, and never given a NEXT_PUBLIC_ prefix.',
              ],
              [
                'The audit trail is append-only',
                'There is no update or delete path to it, and it holds no foreign keys — so it survives the deletion of whatever it describes, which is exactly when it matters most.',
              ],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="flex gap-4 border-b border-chalk/[0.06] px-[1.125rem] py-4 last:border-b-0"
              >
                <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Icon name="shield" className="h-3.5 w-3.5 shrink-0 text-validated" />
                    <span className="font-display text-[0.875rem] font-bold uppercase tracking-[-0.02em] text-chalk">
                      {title}
                    </span>
                  </div>
                  <p className="mt-2 max-w-[70ch] text-[0.78125rem] leading-relaxed text-chalk/50">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* --- 6. System standards (read-only, officers and admins) -------- */}
      <RoleGate roles={['GOVERNMENT_OFFICER', 'EVALUATOR', 'ADMIN']}>
        <section aria-label="System standards">
          <SectionHead title="System standards" meta="Read-only · set in code" />

          <p className="mb-4 max-w-[68ch] text-[0.8125rem] leading-relaxed text-chalk/45">
            Procurement constants. They are not editable from this screen on purpose: a threshold a user
            can move from a settings page is a threshold that gets moved the first time it is
            inconvenient, which is exactly the moment it was written for.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {standards.map((s) => (
              <Card key={s.label}>
                <div className="flex items-start gap-3.5">
                  <span className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-[10px] tint-chalk">
                    <Icon name={s.icon} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-[0.8125rem] font-semibold text-chalk">{s.label}</span>
                      <span className="font-display text-[0.9375rem] font-extrabold tabular-nums text-signal">
                        {s.value}
                      </span>
                    </div>

                    <p className="mt-2 text-[0.78125rem] leading-relaxed text-chalk/50">{s.note}</p>

                    <RoleGate roles={['ADMIN']}>
                      <p className="mt-2.5 truncate font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                        {s.where}
                      </p>
                    </RoleGate>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-5">
            <SectionHead title="Not configurable" meta="On purpose" />

            <Card className="p-0">
              <ul>
                {[
                  [
                    'Payment cannot precede validated evidence',
                    'The ledger is a state machine with no transition from filed evidence to paid. There is no argument to any method that releases an unapproved tranche — bypassing it means editing the service, which leaves a diff.',
                  ],
                  [
                    'A failure cannot be recorded without a named cause',
                    'Closing a pilot that missed its target is refused unless the cause is given. An uncaused failure adds a row to the corpus and teaches the next pilot nothing.',
                  ],
                  [
                    'A thin domain cannot report a finding',
                    'Below the reporting threshold the simulator still runs, but its confidence ratio is returned as context with a mandatory caveat rather than as a result.',
                  ],
                  [
                    'An unanswerable question is not answered',
                    'Policy retrieval returns no analysis when nothing clears the relevance floor, rather than composing a plausible reply from the nearest clause.',
                  ],
                  [
                    'The assistant cannot decide anything',
                    'Eligibility, scores, evidence state, payment state and the scale decision are all computed before the model is called and supplied to it as facts. It has no task that returns a decision.',
                  ],
                ].map(([title, body], i) => (
                  <li
                    key={title}
                    className="flex gap-4 border-b border-chalk/[0.06] px-[1.125rem] py-4 last:border-b-0"
                  >
                    <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-chalk/30">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <Icon name="lock" className="h-3.5 w-3.5 shrink-0 text-risk" />
                        <span className="font-display text-[0.875rem] font-bold uppercase tracking-[-0.02em] text-chalk">
                          {title}
                        </span>
                      </div>
                      <p className="mt-2 max-w-[70ch] text-[0.78125rem] leading-relaxed text-chalk/50">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <p className="mt-4 max-w-[62ch] text-[0.8125rem] leading-relaxed text-chalk/45">
              A procurement system that cannot say no is not a procurement system. These refusals are
              enforced in code rather than in guidance, which is the difference between a rule and a
              suggestion under deadline pressure.
            </p>
          </div>
        </section>
      </RoleGate>
    </>
  );
}
