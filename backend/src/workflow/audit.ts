import { AuditAction } from '@prisma/client';
import type { Db } from './repositories';

/**
 * The append-only lifecycle trail.
 *
 * One function, deliberately. Every significant transition in the pathway is
 * written through `record()` and there is no update or delete path anywhere in
 * the application — an audit log that ordinary CRUD can rewrite is not an audit
 * log, and the moment it matters is exactly the moment someone wants it changed.
 *
 * `AuditEvent` carries no foreign keys, so a trail survives the deletion of what
 * it describes. Deleting a demonstration scenario removes its pilots and leaves
 * the record that they existed.
 *
 * `actorUserId` always comes from a verified token. There is no parameter here
 * that a request body can reach.
 */
export async function record(
  db: Db,
  entry: {
    actorUserId: string | null;
    subjectType: 'Challenge' | 'StartupMatch' | 'Evaluation' | 'Pilot' | 'PilotMilestone' | 'PilotEvidence' | 'ScaleDecision';
    subjectId: string;
    action: AuditAction;
    detail: string;
  },
): Promise<void> {
  await db.auditEvent.create({
    data: {
      actorUserId: entry.actorUserId,
      subjectType: entry.subjectType,
      subjectId: entry.subjectId,
      action: entry.action,
      detail: entry.detail,
    },
  });
}

/** The trail for one subject, oldest first — the order a reader wants it in. */
export function trailFor(db: Db, subjectType: string, subjectId: string) {
  return db.auditEvent.findMany({
    where: { subjectType, subjectId },
    orderBy: { at: 'asc' },
  });
}

/**
 * Everything touching one pilot, including its milestones and evidence.
 *
 * Assembled by subject id rather than by a join, because there is no foreign
 * key to join on — which is the price of a trail that outlives its subjects.
 */
export async function pilotTrail(db: Db, pilotId: string, milestoneIds: string[]) {
  return db.auditEvent.findMany({
    where: { subjectId: { in: [pilotId, ...milestoneIds] } },
    orderBy: { at: 'asc' },
  });
}
