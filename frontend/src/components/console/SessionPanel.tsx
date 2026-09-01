'use client';

import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Who is signed in.
 *
 * This card previously stated that there was no session and that sign-in was
 * not implemented. Both were true when it was written and both are now false,
 * which is the more dangerous failure of the two: a reader who is looking at
 * their own authenticated console and being told there is no session cannot
 * tell which of the two the product is wrong about.
 *
 * It still refuses to assert authority. The card names the signed-in person and
 * their role because those are read from a verified token, and says plainly
 * where a department or designation has not been set rather than filling either
 * in — an invented approver is the detail a reader is least likely to question.
 */
export function SessionPanel() {
  const { loading, user, profile } = useAuth();

  if (loading) {
    return (
      <section className="rounded-[12px] border border-chalk/[0.10] bg-void-lift/60 p-4">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-chalk/40">
          Session
        </span>
        <p className="mt-2.5 text-[0.75rem] text-chalk/45">Checking…</p>
      </section>
    );
  }

  if (!user || !profile) {
    return (
      <section className="rounded-[12px] border border-chalk/[0.10] bg-void-lift/60 p-4">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
          No session
        </span>
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-chalk/55">
          You are not signed in. Nothing on this console can be approved without an
          authenticated account.
        </p>
      </section>
    );
  }

  const role = profile.role.replace(/_/g, ' ').toLowerCase();

  /**
   * Stated as absences, not filled in. A department is what gives a challenge
   * its attribution, so a blank one has to read as blank.
   */
  const unset: string[] = [];
  if (!profile.departmentName) unset.push('Department not set');
  if (!profile.designation) unset.push('Designation not set');

  return (
    <section className="rounded-[12px] border border-chalk/[0.10] bg-void-lift/60 p-4">
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">
        Signed in
      </span>

      <p className="mt-2.5 font-display text-[0.9375rem] font-bold leading-tight text-chalk">
        {profile.displayName}
      </p>
      <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-chalk/45">
        {role}
      </p>

      {profile.departmentName && (
        <p className="mt-2 text-[0.75rem] leading-relaxed text-chalk/65">
          {profile.departmentName}
          {profile.designation ? ` · ${profile.designation}` : ''}
        </p>
      )}

      {unset.length > 0 && (
        <ul className="mt-3 border-t border-chalk/[0.08] pt-3">
          {unset.map((item) => (
            <li key={item} className="py-1 text-[0.6875rem] leading-relaxed text-chalk/40">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
