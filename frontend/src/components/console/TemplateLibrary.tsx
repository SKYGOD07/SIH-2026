'use client';

import { useState } from 'react';
import { Icon } from './Icon';
import { Pill } from './primitives';
import { STANDARD_TEMPLATES } from '@/data/templates';
import { cn } from '@/lib/utils';

/**
 * The seven standard templates, opened one at a time.
 *
 * The whole library laid flat is around forty fields, which is unreadable and,
 * worse, undermines the point — the value of a standard template is that
 * somebody sits down with one of them, not that seven exist. So the page shows
 * the set and the reader opens the one they need.
 *
 * Each field shows the guidance that says what a good answer looks like. It used
 * to sit beside a worked example, which was the better layout — but every one of
 * those examples invented a departmental officer, a rupee figure or a document
 * reference. The pairing returns when there is a real challenge to draw one from.
 */
export function TemplateLibrary() {
  const [active, setActive] = useState(STANDARD_TEMPLATES[0].id);
  const template = STANDARD_TEMPLATES.find((t) => t.id === active) ?? STANDARD_TEMPLATES[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* --- the set --- */}
      <div className="card h-fit overflow-hidden p-0 lg:sticky lg:top-7">
        <ol>
          {STANDARD_TEMPLATES.map((t) => {
            const on = t.id === active;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  data-cursor="open"
                  onClick={() => setActive(t.id)}
                  aria-current={on ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-chalk/[0.06] px-4 py-3 text-left transition-colors last:border-b-0',
                    on ? 'bg-signal/[0.1]' : 'hover:bg-chalk/[0.03]',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.1em]',
                      on ? 'text-signal' : 'text-chalk/30',
                    )}
                  >
                    {t.id}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate font-display text-[0.78125rem] font-bold uppercase tracking-[-0.01em] transition-colors',
                      on ? 'text-chalk' : 'text-chalk/50',
                    )}
                  >
                    {t.name}
                  </span>
                  {on ? (
                    <Icon name="chevronRight" className="h-3 w-3 shrink-0 text-signal" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* --- the open one --- */}
      <div className="card p-[1.375rem]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-chalk/35">
              {template.id} · stage {template.stage}
            </span>
            <h3 className="mt-1.5 font-display text-[1.25rem] font-extrabold uppercase tracking-[-0.03em] text-chalk">
              {template.name}
            </h3>
          </div>
          <Pill tone="chalk">Issued by the {template.author.toLowerCase()}</Pill>
        </div>

        <p className="mt-4 max-w-[62ch] text-[0.8125rem] leading-relaxed text-chalk/55">
          {template.purpose}
        </p>

        <p className="mt-2.5 max-w-[62ch] font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.1em] text-chalk/30">
          PS clause: {template.psClause}
        </p>

        <ol className="mt-7 border-t border-chalk/[0.08]">
          {template.fields.map((field, i) => (
            <li key={field.label} className="border-b border-chalk/[0.06] py-4">
              <div className="flex items-baseline gap-4">
                <span className="w-6 shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-display text-[0.875rem] font-bold uppercase tracking-[-0.02em] text-chalk">
                  {field.label}
                </span>
                {field.required ? (
                  <span className="shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-chalk/30">
                    Required
                  </span>
                ) : null}
              </div>

              <p className="mt-2.5 max-w-[70ch] text-[0.78125rem] leading-relaxed text-chalk/50 sm:pl-10">
                {field.guidance}
              </p>
            </li>
          ))}
        </ol>

        {template.standingClauses ? (
          <div className="mt-7">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-signal">
              Standing clauses — carried into every instance
            </span>
            <ul className="mt-3 flex flex-col gap-2">
              {template.standingClauses.map((clause) => (
                <li
                  key={clause}
                  className="flex gap-3 rounded-[10px] bg-chalk/[0.03] px-3.5 py-2.5 text-[0.78125rem] leading-relaxed text-chalk/75"
                >
                  <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                  {clause}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
