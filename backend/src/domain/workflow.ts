import {
  CommentRequiredError,
  ForbiddenTransitionError,
  IllegalTransitionError,
} from './errors.js';

export const STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;
export type Status = (typeof STATUSES)[number];

export const ACTIONS = [
  'submit',
  'start_review',
  'approve',
  'reject',
  'return_for_changes',
] as const;
export type Action = (typeof ACTIONS)[number];

export type Role = 'APPLICANT' | 'REVIEWER';

export interface Actor {
  userId: string;
  role: Role;
  isOwner: boolean;
}

interface TransitionRule {
  to: Status;
  /** Who may perform this transition, given the actor's role and ownership. */
  authorize: (actor: Actor) => boolean;
  /** When true, a non-empty comment is mandatory. */
  requireComment: boolean;
}

const isOwningApplicant = (a: Actor): boolean => a.role === 'APPLICANT' && a.isOwner;
const isReviewer = (a: Actor): boolean => a.role === 'REVIEWER';

// The entire legal workflow expressed as data. Any (status, action) pair not
// present here is an illegal transition. Keeping the policy in one table makes
// it auditable at a glance and lets the tests enumerate every case.
const TRANSITIONS: Partial<Record<Status, Partial<Record<Action, TransitionRule>>>> = {
  DRAFT: {
    submit: { to: 'SUBMITTED', authorize: isOwningApplicant, requireComment: false },
  },
  SUBMITTED: {
    start_review: { to: 'UNDER_REVIEW', authorize: isReviewer, requireComment: false },
    return_for_changes: { to: 'DRAFT', authorize: isReviewer, requireComment: true },
  },
  UNDER_REVIEW: {
    approve: { to: 'APPROVED', authorize: isReviewer, requireComment: false },
    reject: { to: 'REJECTED', authorize: isReviewer, requireComment: true },
    return_for_changes: { to: 'DRAFT', authorize: isReviewer, requireComment: true },
  },
};

export interface TransitionResult {
  from: Status;
  to: Status;
  action: Action;
  comment: string | null;
}

/**
 * Pure decision function. Validates an attempted transition and returns the
 * resulting status plus a normalized comment, or throws a typed DomainError.
 * It performs no I/O; the caller persists the new status and audit entry.
 *
 * Checks run in a fixed order so behaviour is deterministic and testable:
 *   1. legal transition?  -> IllegalTransitionError
 *   2. actor permitted?   -> ForbiddenTransitionError
 *   3. comment present?   -> CommentRequiredError
 */
export function applyTransition(
  from: Status,
  action: Action,
  actor: Actor,
  comment?: string | null,
): TransitionResult {
  const rule = TRANSITIONS[from]?.[action];
  if (!rule) {
    throw new IllegalTransitionError(from, action);
  }
  if (!rule.authorize(actor)) {
    throw new ForbiddenTransitionError(action, actor.role);
  }

  const trimmed = comment?.trim() ?? '';
  if (rule.requireComment && trimmed === '') {
    throw new CommentRequiredError(action);
  }

  return {
    from,
    to: rule.to,
    action,
    comment: trimmed === '' ? null : trimmed,
  };
}

/**
 * The actions an actor may legally perform from a given status right now.
 * This is the single source of truth shared by the API (to gate mutations)
 * and the frontend (to decide which buttons to render). The client never
 * decides what is allowed.
 */
export function availableTransitions(from: Status, actor: Actor): Action[] {
  const rules = TRANSITIONS[from];
  if (!rules) return [];
  return (Object.keys(rules) as Action[]).filter((action) =>
    rules[action]!.authorize(actor),
  );
}

/** Whether an action requires a comment (drives the UI's required-comment prompt). */
export function actionRequiresComment(from: Status, action: Action): boolean {
  return TRANSITIONS[from]?.[action]?.requireComment ?? false;
}

/** Editing is a field mutation while in DRAFT, not a status transition. */
export function canEdit(status: Status, actor: Actor): boolean {
  return status === 'DRAFT' && isOwningApplicant(actor);
}

export function isTerminal(status: Status): boolean {
  return status === 'APPROVED' || status === 'REJECTED';
}
