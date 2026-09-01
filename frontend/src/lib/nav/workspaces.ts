import type { UserRole } from '@/lib/auth/AuthProvider';

/**
 * What each role's workspace contains.
 *
 * One definition, read by the sidebar, the route guard and the post-login
 * redirect alike. When those three disagree — a link to a page the guard
 * refuses, or a redirect to a route absent from the navigation — the product
 * feels broken in a way that is tedious to trace, so they share a source.
 *
 * Sarthi is one platform with two workspaces, not two applications. The visual
 * shell, the theme, the components and the disclosure banner are identical
 * across roles. What differs is *information and actions*: a government officer
 * is asking "what needs my decision?", a startup is asking "what can I apply
 * for and what do I owe?". Showing both the same navigation answers neither.
 *
 * None of this is a security boundary. It decides what is *offered*; the
 * backend decides what is *permitted*, on every request, from a verified token.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface Workspace {
  /** Where this role lands after signing in. */
  home: string;
  /**
   * Shown under the mark, so the workspace names itself.
   *
   * Kept to one short word: the sidebar rail is 13.25rem and anything longer
   * truncates to an ellipsis under the logo, which reads as a bug rather than
   * as a label.
   */
  name: string;
  /** The question the dashboard answers, used as its heading. */
  question: string;
  primary: NavItem[];
  secondary: NavItem[];
}

/**
 * The government workspace: decide.
 *
 * Ordered by the pathway rather than alphabetically — a challenge becomes
 * matches, matches become a pilot, a pilot produces evidence and a decision.
 * The navigation is the process.
 */
const GOVERNMENT: Workspace = {
  home: '/government',
  name: 'Government',
  question: 'What needs you',
  primary: [
    { href: '/government', label: 'Dashboard', icon: 'console' },
    { href: '/government/discover', label: 'Find solutions', icon: 'intelligence' },
    { href: '/challenges', label: 'Challenges', icon: 'target' },
    { href: '/startups', label: 'Startups', icon: 'users' },
    { href: '/pilots', label: 'Pilots', icon: 'flask' },
    { href: '/ledger', label: 'Evidence & ledger', icon: 'ledger' },
  ],
  secondary: [
    { href: '/templates', label: 'Templates', icon: 'templates' },
    { href: '/corpus', label: 'Evidence base', icon: 'corpus' },
    { href: '/intelligence', label: 'Intelligence', icon: 'intelligence' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ],
};

/**
 * The startup workspace: apply and participate.
 *
 * Deliberately possessive throughout — "my company", "my applications". A
 * startup is not browsing a registry of startups; it is looking after one
 * company, its own. The government's registry view has no counterpart here.
 */
const STARTUP: Workspace = {
  home: '/startup',
  name: 'Startup',
  question: 'Your next step',
  primary: [
    { href: '/startup', label: 'Dashboard', icon: 'console' },
    { href: '/startup/company', label: 'My company', icon: 'users' },
    { href: '/startup/challenges', label: 'Opportunities', icon: 'target' },
    { href: '/startup/applications', label: 'My applications', icon: 'ledger' },
    { href: '/startup/pilot', label: 'My pilot', icon: 'flask' },
  ],
  secondary: [
    { href: '/startup/documents', label: 'Documents', icon: 'corpus' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ],
};

const EVALUATOR: Workspace = {
  home: '/evaluator',
  name: 'Evaluator',
  question: 'Awaiting your review',
  primary: [
    { href: '/evaluator', label: 'Dashboard', icon: 'console' },
    { href: '/evaluator/evaluations', label: 'Evaluations', icon: 'ledger' },
  ],
  secondary: [{ href: '/settings', label: 'Settings', icon: 'settings' }],
};

const ADMIN: Workspace = {
  home: '/government',
  name: 'Admin',
  question: 'What needs you',
  primary: [
    { href: '/government', label: 'Dashboard', icon: 'console' },
    { href: '/government/discover', label: 'Find solutions', icon: 'intelligence' },
    { href: '/challenges', label: 'Challenges', icon: 'target' },
    { href: '/startups', label: 'Startups', icon: 'users' },
    { href: '/pilots', label: 'Pilots', icon: 'flask' },
  ],
  secondary: [
    { href: '/admin/users', label: 'Users', icon: 'users' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ],
};

const BY_ROLE: Record<UserRole, Workspace> = {
  GOVERNMENT_OFFICER: GOVERNMENT,
  STARTUP,
  EVALUATOR,
  // An administrator works the government surface plus provisioning, rather
  // than getting a third information architecture nobody would maintain.
  ADMIN,
};

export function workspaceFor(role: UserRole | null | undefined): Workspace {
  return role ? BY_ROLE[role] : GOVERNMENT;
}

/** Route prefixes only these roles may open. Everything else is shared. */
const OWNED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/government', roles: ['GOVERNMENT_OFFICER', 'ADMIN'] },
  { prefix: '/startup', roles: ['STARTUP'] },
  { prefix: '/evaluator', roles: ['EVALUATOR', 'ADMIN'] },
  { prefix: '/admin', roles: ['ADMIN'] },
];

/**
 * Whether a role may open a path.
 *
 * Used to stop a reader wandering into a workspace that is not theirs — by a
 * typed URL, a stale bookmark, or a link sent to them. It is navigation, not
 * protection: the data behind those pages is guarded by the API.
 */
export function mayOpen(role: UserRole | null | undefined, path: string): boolean {
  const owned = OWNED_PREFIXES.find(
    (o) => path === o.prefix || path.startsWith(`${o.prefix}/`),
  );
  if (!owned) return true;
  return !!role && owned.roles.includes(role);
}
