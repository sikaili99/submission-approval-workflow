import type { Application, AuditEntry, User } from '../generated/prisma/index.js';
import {
  type Actor,
  type Status,
  availableTransitions,
  canEdit,
} from '../domain/workflow.js';

type AuditEntryWithActor = AuditEntry & { actor: Pick<User, 'id' | 'name' | 'role'> };

export function serializeAuditEntry(entry: AuditEntryWithActor) {
  return {
    id: entry.id,
    action: entry.action,
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    comment: entry.comment,
    createdAt: entry.createdAt.toISOString(),
    actor: { id: entry.actor.id, name: entry.actor.name, role: entry.actor.role },
  };
}

export function serializeApplicationSummary(app: Application) {
  return {
    id: app.id,
    title: app.title,
    category: app.category,
    description: app.description,
    amount: app.amount ? app.amount.toString() : null,
    attachmentUrl: app.attachmentUrl,
    attachmentName: app.attachmentName,
    status: app.status,
    ownerId: app.ownerId,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export function serializeApplicationDetail(
  app: Application & { auditEntries: AuditEntryWithActor[] },
  actor: Actor,
) {
  return {
    ...serializeApplicationSummary(app),
    availableTransitions: availableTransitions(app.status as Status, actor),
    canEdit: canEdit(app.status as Status, actor),
    auditTrail: app.auditEntries.map(serializeAuditEntry),
  };
}
