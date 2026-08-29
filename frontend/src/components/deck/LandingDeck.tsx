'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Deck, Slide } from './Deck';
import { WipeText, WipeReveal } from './WipeText';
import { cn } from '@/lib/utils';

/**
 * The landing deck.
 *
 * Nine slides, read sideways, answering one question: *which startup should we
 * test for this problem?* Everything on the page serves that, and anything that
 * did not has been taken off it.
 *
 *   01 what it is        02 what it is not     03 who uses it
 *   04 the five questions 05 the problem in    06 the shortlist
 *   07 why this one      08 the evidence       09 start the pilot
 *
 * Two rules hold the deck together.
 *
 * The type is already there. Every word renders from the first frame in a
 * near-black that reads as shape but not as language, and wipes to white as the
 * reader arrives at it — scrubbed against horizontal travel, not faded in on a
 * timer. Nothing appears late and nothing is missing from a screenshot.
 *
 * And a number is drawn, not written. The counts in this deck are the argument:
 * 142 narrowing to 3 is the product working, and a funnel says that in a way
 * four lines of prose cannot. Where a slide could be a paragraph or a figure,
 * it is a figure.
 */

/* ------------------------------------------------------------------ type */

/** The deck's headline. Heavy, tight, upper case, wiped per character. */
function Head({
  children,
  size = 'lg',
  className,
  ...rest
}: {
  children: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  on?: string;
  off?: string;
}) {
  return (
    <WipeText
      as="h2"
      split="chars"
      stagger={0.012}
      className={cn(
        'font-display font-black uppercase',
        size === 'xl' ? 'text-display-xl' : size === 'lg' ? 'text-display-lg' : 'text-display-md',
        className,
      )}
      {...rest}
    >
      {children}
    </WipeText>
  );
}

/** The single line under a headline. One line — never two. */
function Line({
  children,
  className,
  ...rest
}: {
  children: string;
  className?: string;
  on?: string;
  off?: string;
}) {
  return (
    <WipeText
      as="p"
      split="words"
      stagger={0.03}
      off="#2A2A2A"
      on="rgba(255,255,255,0.62)"
      className={cn(
        'mt-[clamp(1.25rem,3vh,2rem)] max-w-[52ch] text-[0.9375rem] leading-relaxed',
        className,
      )}
      {...rest}
    >
      {children}
    </WipeText>
  );
}

/** Small monospace caption used inside figures. */
function Cap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40',
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ 01 */

function WhatItIs() {
  return (
    <Slide index="01" label="MahaInnovate" id="deck-what">
      <Head size="xl" className="max-w-[14ch]">
        Which startup should we test for this problem?
      </Head>

      <WipeReveal className="mt-[clamp(1.5rem,4vh,2.5rem)]">
        <span className="inline-block h-[3px] w-[7rem] bg-flare-bright" />
      </WipeReveal>

      <Line className="max-w-[54ch]">
        MahaInnovate helps a government officer answer that for a specific departmental problem,
        from real evidence, policy rules and the results of pilots already run.
      </Line>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 02 */

const NOT = ['A startup directory', 'An investment platform', 'Another GeM', 'A chatbot'];

function WhatItIsNot() {
  return (
    <Slide index="02" label="What it is not" id="deck-not">
      <Head size="md" className="max-w-[16ch]">
        Four things it is not.
      </Head>

      <ol className="mt-[clamp(1.75rem,5vh,3rem)] max-w-[46rem]">
        {NOT.map((item, i) => (
          <li key={item} className="border-b border-chalk/[0.08] py-[clamp(0.6rem,1.6vh,1rem)]">
            <span className="flex items-baseline gap-6">
              <Cap className="w-6 shrink-0">{String(i + 1).padStart(2, '0')}</Cap>

              <span className="relative min-w-0">
                <WipeText
                  as="span"
                  split="chars"
                  stagger={0.01}
                  className="block font-display text-display-sm font-extrabold uppercase"
                >
                  {item}
                </WipeText>

                {/* Struck through in the accent: present, and ruled out. */}
                <WipeReveal
                  from={0}
                  start={0.8}
                  end={0.5}
                  className="pointer-events-none absolute inset-x-0 top-1/2 origin-left"
                >
                  <span className="block h-[2px] w-full bg-flare-bright" />
                </WipeReveal>
              </span>
            </span>
          </li>
        ))}
      </ol>

      <Line>
        It is one decision support tool for one decision, and it is judged on whether that decision
        gets better.
      </Line>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 03 */

const SECONDARY = [
  {
    who: 'Startup',
    wants: ['Discover challenges', 'Check eligibility', 'Track the pilot', 'Get paid on milestones'],
  },
  {
    who: 'Evaluator',
    wants: ['Structured evaluation', 'Evidence to hand', 'Transparent scoring', 'An audit trail'],
  },
];

function WhoUsesIt() {
  return (
    <Slide index="03" label="Who uses it" id="deck-who">
      <Head size="md" className="max-w-[20ch]">
        The officer is the main character.
      </Head>

      <div className="mt-[clamp(1.75rem,5vh,3rem)] grid max-w-[74rem] gap-x-12 gap-y-8 lg:grid-cols-[1.15fr_1fr]">
        {/* --- the primary user --- */}
        <WipeReveal>
          <div className="border border-flare-bright/50 bg-flare/[0.07] p-[clamp(1.1rem,2.6vh,1.75rem)]">
            <Cap className="text-flare-bright">Primary user</Cap>
            <p className="mt-3 font-display text-display-xs font-extrabold uppercase text-chalk">
              Government innovation &amp; procurement officer
            </p>
            <p className="mt-4 border-l-2 border-flare-bright pl-4 text-[0.9375rem] leading-relaxed text-chalk/70">
              &ldquo;We need a technology solution to reduce municipal water leakage.&rdquo;
            </p>
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-chalk/45">
              They open MahaInnovate with a problem, not a shortlist. Everything else on this page
              exists to get them to a defensible pilot decision.
            </p>
          </div>
        </WipeReveal>

        {/* --- the two secondary users --- */}
        <WipeReveal start={0.75} className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {SECONDARY.map((group) => (
            <div key={group.who}>
              <Cap>Secondary</Cap>
              <p className="mt-2 font-display text-lg font-extrabold uppercase tracking-[-0.02em] text-chalk/85">
                {group.who}
              </p>
              <ul className="mt-3 border-t border-chalk/[0.08]">
                {group.wants.map((want) => (
                  <li
                    key={want}
                    className="border-b border-chalk/[0.06] py-2 text-[0.8125rem] text-chalk/55"
                  >
                    {want}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </WipeReveal>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 04 */

const QUESTIONS = [
  'What exactly is the problem?',
  'Which startups can solve it?',
  'Are they eligible and credible?',
  'Which one should we pilot?',
  'Did the pilot actually work?',
];

function FiveQuestions() {
  return (
    <Slide index="04" label="The five questions" id="deck-questions">
      <Head size="md" className="max-w-[18ch]">
        Five questions, in order.
      </Head>

      <WipeReveal
        start={0.82}
        className="mt-[clamp(1.75rem,5vh,3rem)] grid max-w-[80rem] gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5"
      >
        {QUESTIONS.map((question, i) => (
          <div key={question} className="border-t border-flare-bright/60 pt-4">
            <span className="font-display text-[2rem] font-black leading-none tracking-[-0.05em] text-flare-bright">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="mt-3 font-display text-[0.9375rem] font-bold uppercase leading-snug tracking-[-0.02em] text-chalk">
              {question}
            </p>
          </div>
        ))}
      </WipeReveal>

      <Line>
        Answer all five and the department has a pilot it can defend. Answer none and it has a
        tender.
      </Line>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 05 */

const TECHNOLOGIES = ['Computer vision', 'IoT', 'Pipeline monitoring', 'Predictive analytics'];

function ProblemIn() {
  return (
    <Slide index="05" label="The problem goes in" id="deck-problem">
      <Head size="md" className="max-w-[20ch]">
        A problem in. Technologies out.
      </Head>

      <WipeReveal
        start={0.82}
        className="mt-[clamp(1.75rem,5vh,3rem)] grid max-w-[78rem] items-center gap-x-10 gap-y-8 lg:grid-cols-[1fr_auto_1fr]"
      >
        {/* --- what the officer types --- */}
        <div className="border border-chalk/15 p-[clamp(1.1rem,2.6vh,1.75rem)]">
          <Cap>Government problem</Cap>
          <p className="mt-3 font-display text-display-xs font-extrabold uppercase leading-tight text-chalk">
            Reduce municipal water leakage by 20% in 90 days.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/35">
            <span>Baseline 31%</span>
            <span>Target 24%</span>
            <span>3 wards</span>
          </p>
        </div>

        {/* --- the arrow --- */}
        <div className="hidden items-center gap-3 lg:flex">
          <span className="block h-px w-16 bg-flare-bright" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-flare-bright">
            reads
          </span>
          <span className="block h-px w-16 bg-flare-bright" />
        </div>

        {/* --- what comes back --- */}
        <div>
          <Cap className="text-flare-bright">Related technologies</Cap>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {TECHNOLOGIES.map((tech) => (
              <li
                key={tech}
                className="border border-chalk/20 px-4 py-2 font-display text-[0.8125rem] font-bold uppercase tracking-[-0.01em] text-chalk"
              >
                {tech}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-[38ch] text-[0.8125rem] leading-relaxed text-chalk/45">
            Derived from the problem, not chosen from a menu — which is what stops the challenge
            being written as a product specification.
          </p>
        </div>
      </WipeReveal>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 06 */

const FUNNEL = [
  { n: 142, label: 'Relevant', note: 'Match the technology profile' },
  { n: 23, label: 'Potentially eligible', note: 'Clear the policy gate' },
  { n: 8, label: 'Strong matches', note: 'Evidence supports the claim' },
  { n: 3, label: 'Recommended for pilot', note: 'Ranked, with reasons' },
];

/**
 * The narrowing, drawn to scale.
 *
 * Each bar's width is its count as a fraction of the widest, so the collapse
 * from 142 to 3 is visible rather than asserted. This is the single most
 * persuasive figure in the deck and it is the one place a proportional bar
 * earns its space over a number set large.
 */
function ShortlistFunnel() {
  const widest = FUNNEL[0].n;

  return (
    <Slide index="06" label="The shortlist" id="deck-shortlist">
      <Head size="md" className="max-w-[16ch]">
        142 down to 3.
      </Head>

      <WipeReveal start={0.82} className="mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[72rem]">
        <ol>
          {FUNNEL.map((step, i) => {
            const last = i === FUNNEL.length - 1;
            return (
              <li key={step.label} className="py-[clamp(0.5rem,1.4vh,0.9rem)]">
                <div className="flex items-baseline justify-between gap-6">
                  <span className="flex items-baseline gap-5">
                    <span
                      className={cn(
                        'font-display text-[clamp(1.6rem,3.4vw,2.75rem)] font-black leading-none tracking-[-0.05em] tabular-nums',
                        last ? 'text-flare-bright' : 'text-chalk',
                      )}
                    >
                      {step.n}
                    </span>
                    <span className="font-display text-[0.9375rem] font-bold uppercase tracking-[-0.02em] text-chalk/85">
                      {step.label}
                    </span>
                  </span>
                  <Cap className="hidden sm:block">{step.note}</Cap>
                </div>

                <span className="mt-2.5 block h-[6px] w-full bg-chalk/[0.07]">
                  <span
                    className={cn('block h-full', last ? 'bg-flare-bright' : 'bg-chalk/70')}
                    style={{ width: `${(step.n / widest) * 100}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ol>
      </WipeReveal>

      <Line>
        Every drop between two rows is a rule that can be named, and an officer can ask which one
        removed a given startup.
      </Line>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 07 */

const SCORES = [
  { label: 'Problem fit', score: 92 },
  { label: 'Technical evidence', score: 88 },
  { label: 'Deployment experience', score: 91 },
  { label: 'Compliance', score: 94 },
  { label: 'Pilot evidence', score: 86 },
];

const OVERALL = 90;

function WhyThisStartup() {
  return (
    <Slide index="07" label="Why this one" id="deck-why">
      <Head size="md" className="max-w-[18ch]">
        Why this startup, in five numbers.
      </Head>

      <WipeReveal
        start={0.82}
        className="mt-[clamp(1.5rem,4vh,2.5rem)] grid max-w-[76rem] gap-x-14 gap-y-8 lg:grid-cols-[1.5fr_1fr]"
      >
        {/* --- the five criteria --- */}
        <ol>
          {SCORES.map((row) => (
            <li key={row.label} className="py-[clamp(0.4rem,1.2vh,0.75rem)]">
              <div className="flex items-baseline justify-between gap-6">
                <span className="font-display text-[0.9375rem] font-bold uppercase tracking-[-0.02em] text-chalk/85">
                  {row.label}
                </span>
                <span className="font-display text-[1.125rem] font-extrabold tabular-nums text-chalk">
                  {row.score}
                </span>
              </div>
              <span className="mt-2 block h-[4px] w-full bg-chalk/[0.07]">
                <span className="block h-full bg-chalk/70" style={{ width: `${row.score}%` }} />
              </span>
            </li>
          ))}
        </ol>

        {/* --- the composite --- */}
        <div className="flex flex-col justify-center border border-flare-bright/50 bg-flare/[0.07] p-[clamp(1.1rem,2.6vh,1.75rem)]">
          <Cap className="text-flare-bright">Overall suitability</Cap>
          <span className="mt-2 font-display text-[clamp(3.5rem,7vw,5.5rem)] font-black leading-none tracking-[-0.05em] tabular-nums text-flare-bright">
            {OVERALL}
          </span>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-chalk/55">
            A weighted read of the five, not an opinion. Every component is traceable to the
            evidence behind it, so a rejected startup can be told which number moved.
          </p>
        </div>
      </WipeReveal>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 08 */

const EVIDENCE = [
  { figure: '3', label: 'Previous pilots', note: 'Outcomes recorded against baselines' },
  { figure: '4', label: 'Government deployments', note: 'In production, named departments' },
  { figure: '✓', label: 'Verified compliance', note: 'Screened against the policy corpus' },
  { figure: '✓', label: 'Technology capability', note: 'Matched to the challenge profile' },
];

function Evidence() {
  return (
    <Slide index="08" label="The evidence" id="deck-evidence">
      <Head size="md" className="max-w-[18ch]">
        Every number has a source.
      </Head>

      <WipeReveal
        start={0.82}
        className="mt-[clamp(1.75rem,5vh,3rem)] grid max-w-[80rem] gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-4"
      >
        {EVIDENCE.map((item) => (
          <div key={item.label} className="border-t border-chalk/20 pt-4">
            <span className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-none tracking-[-0.05em] text-flare-bright">
              {item.figure}
            </span>
            <p className="mt-3 font-display text-[0.9375rem] font-bold uppercase tracking-[-0.02em] text-chalk">
              {item.label}
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-chalk/45">{item.note}</p>
          </div>
        ))}
      </WipeReveal>

      <Line>
        This is the difference between a recommendation and a ranking: the officer can open any
        figure and see the pilot it came from.
      </Line>
    </Slide>
  );
}

/* ------------------------------------------------------------------ 09 */

function StartPilot() {
  return (
    <Slide index="09" label="Start the pilot" id="deck-start" invert>
      <WipeText
        as="h2"
        split="chars"
        stagger={0.012}
        on="#FFFFFF"
        off="rgba(255,255,255,0.22)"
        className="max-w-[12ch] font-display text-display-xl font-black uppercase"
      >
        Start the pilot.
      </WipeText>

      <WipeReveal start={0.78} className="mt-[clamp(1.75rem,5vh,2.75rem)]">
        <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed text-chalk/75">
          From here it is a milestone contract: bounded scope, evidence named before day one, and
          payment released only against evidence the department has validated.
        </p>

        <div className="mt-[clamp(1.5rem,4vh,2.25rem)] flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            data-cursor="enter"
            className="inline-flex items-center gap-3 rounded-full bg-chalk px-7 py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-flare transition-opacity hover:opacity-85"
          >
            Open the console
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/templates"
            data-cursor="open"
            className="inline-flex items-center gap-3 rounded-full border border-chalk/40 px-7 py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-chalk transition-colors hover:border-chalk"
          >
            The pilot agreement
          </Link>
        </div>

        <p className="mt-[clamp(1.5rem,4vh,2.25rem)] font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/60">
          Smart India Hackathon · Government of Maharashtra
        </p>
      </WipeReveal>
    </Slide>
  );
}

/* ------------------------------------------------------------------ */

const CHAPTERS = [
  'What it is',
  'What it is not',
  'Who uses it',
  'Five questions',
  'Problem in',
  'Shortlist',
  'Why this one',
  'Evidence',
  'Start',
];

export function LandingDeck() {
  return (
    <Deck chapters={CHAPTERS}>
      <WhatItIs />
      <WhatItIsNot />
      <WhoUsesIt />
      <FiveQuestions />
      <ProblemIn />
      <ShortlistFunnel />
      <WhyThisStartup />
      <Evidence />
      <StartPilot />
    </Deck>
  );
}
