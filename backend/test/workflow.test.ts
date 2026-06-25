import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  STATUSES,
  type Action,
  type Actor,
  type Status,
  actionRequiresComment,
  applyTransition,
  availableTransitions,
  canEdit,
  isTerminal,
} from '../src/domain/workflow.js';
import {
  CommentRequiredError,
  ForbiddenTransitionError,
  IllegalTransitionError,
} from '../src/domain/errors.js';

const owner: Actor = { userId: 'u-owner', role: 'APPLICANT', isOwner: true };
const otherApplicant: Actor = { userId: 'u-other', role: 'APPLICANT', isOwner: false };
const reviewer: Actor = { userId: 'u-rev', role: 'REVIEWER', isOwner: false };
// A reviewer who happens to own the application (edge case worth pinning down).
const owningReviewer: Actor = { userId: 'u-rev2', role: 'REVIEWER', isOwner: true };

interface LegalCase {
  from: Status;
  action: Action;
  to: Status;
  actor: Actor;
  comment?: string;
}

// Exactly the six edges in the spec's diagram.
const LEGAL_TRANSITIONS: LegalCase[] = [
  { from: 'DRAFT', action: 'submit', to: 'SUBMITTED', actor: owner },
  { from: 'SUBMITTED', action: 'start_review', to: 'UNDER_REVIEW', actor: reviewer },
  { from: 'SUBMITTED', action: 'return_for_changes', to: 'DRAFT', actor: reviewer, comment: 'fix it' },
  { from: 'UNDER_REVIEW', action: 'approve', to: 'APPROVED', actor: reviewer },
  { from: 'UNDER_REVIEW', action: 'reject', to: 'REJECTED', actor: reviewer, comment: 'no' },
  { from: 'UNDER_REVIEW', action: 'return_for_changes', to: 'DRAFT', actor: reviewer, comment: 'redo' },
];

describe('applyTransition — legal transitions', () => {
  it.each(LEGAL_TRANSITIONS)(
    '$from --$action--> $to',
    ({ from, action, to, actor, comment }) => {
      const result = applyTransition(from, action, actor, comment);
      expect(result.to).toBe(to);
      expect(result.from).toBe(from);
      expect(result.action).toBe(action);
    },
  );
});

describe('applyTransition — illegal transitions (full status × action matrix)', () => {
  const legalKeys = new Set(LEGAL_TRANSITIONS.map((c) => `${c.from}:${c.action}`));

  // Authorize as a reviewer-who-owns so neither role nor ownership masks the
  // illegal-transition check — we want to prove the (status, action) pair
  // itself is rejected, independent of authorization.
  const permissiveActor = owningReviewer;

  const allPairs: Array<{ from: Status; action: Action }> = [];
  for (const from of STATUSES) {
    for (const action of ACTIONS) {
      allPairs.push({ from, action });
    }
  }

  const illegalPairs = allPairs.filter((p) => !legalKeys.has(`${p.from}:${p.action}`));

  it('covers all 25 status × action pairs', () => {
    expect(allPairs).toHaveLength(STATUSES.length * ACTIONS.length);
    expect(illegalPairs.length + LEGAL_TRANSITIONS.length).toBe(allPairs.length);
  });

  it.each(illegalPairs)(
    'rejects $from --$action-> (illegal)',
    ({ from, action }) => {
      expect(() => applyTransition(from, action, permissiveActor, 'x')).toThrow(
        IllegalTransitionError,
      );
    },
  );

  it('terminal states have no outgoing transitions', () => {
    for (const action of ACTIONS) {
      expect(() => applyTransition('APPROVED', action, permissiveActor, 'x')).toThrow(
        IllegalTransitionError,
      );
      expect(() => applyTransition('REJECTED', action, permissiveActor, 'x')).toThrow(
        IllegalTransitionError,
      );
    }
  });
});

describe('applyTransition — authorization', () => {
  it('only the owning applicant may submit a draft', () => {
    expect(applyTransition('DRAFT', 'submit', owner).to).toBe('SUBMITTED');
    expect(() => applyTransition('DRAFT', 'submit', otherApplicant)).toThrow(
      ForbiddenTransitionError,
    );
    expect(() => applyTransition('DRAFT', 'submit', reviewer)).toThrow(
      ForbiddenTransitionError,
    );
  });

  it('an applicant cannot approve their own application', () => {
    // The central authorization invariant from the brief.
    expect(() => applyTransition('UNDER_REVIEW', 'approve', owner)).toThrow(
      ForbiddenTransitionError,
    );
  });

  it.each(['start_review', 'approve', 'reject', 'return_for_changes'] as Action[])(
    'an applicant cannot %s',
    (action) => {
      const from: Status = action === 'start_review' || action === 'return_for_changes'
        ? 'SUBMITTED'
        : 'UNDER_REVIEW';
      expect(() => applyTransition(from, action, owner, 'c')).toThrow(
        ForbiddenTransitionError,
      );
    },
  );

  it('reviewer-owned applications still follow role rules (reviewer may review)', () => {
    expect(applyTransition('UNDER_REVIEW', 'approve', owningReviewer).to).toBe('APPROVED');
  });
});

describe('applyTransition — comment rules', () => {
  it('reject requires a comment', () => {
    expect(() => applyTransition('UNDER_REVIEW', 'reject', reviewer)).toThrow(
      CommentRequiredError,
    );
    expect(() => applyTransition('UNDER_REVIEW', 'reject', reviewer, '   ')).toThrow(
      CommentRequiredError,
    );
    expect(applyTransition('UNDER_REVIEW', 'reject', reviewer, 'not eligible').comment).toBe(
      'not eligible',
    );
  });

  it('return_for_changes requires a comment from both SUBMITTED and UNDER_REVIEW', () => {
    expect(() => applyTransition('SUBMITTED', 'return_for_changes', reviewer)).toThrow(
      CommentRequiredError,
    );
    expect(() => applyTransition('UNDER_REVIEW', 'return_for_changes', reviewer)).toThrow(
      CommentRequiredError,
    );
  });

  it('submit/start_review/approve do not require a comment and trim to null', () => {
    expect(applyTransition('DRAFT', 'submit', owner).comment).toBeNull();
    expect(applyTransition('SUBMITTED', 'start_review', reviewer, '  ').comment).toBeNull();
    expect(applyTransition('UNDER_REVIEW', 'approve', reviewer).comment).toBeNull();
  });

  it('the illegal-transition check precedes the comment check', () => {
    // Even with no comment, an illegal pair fails as illegal, not as comment-required.
    expect(() => applyTransition('DRAFT', 'reject', reviewer)).toThrow(IllegalTransitionError);
  });
});

describe('availableTransitions', () => {
  it('returns role-appropriate actions for the owning applicant', () => {
    expect(availableTransitions('DRAFT', owner)).toEqual(['submit']);
    expect(availableTransitions('SUBMITTED', owner)).toEqual([]);
    expect(availableTransitions('UNDER_REVIEW', owner)).toEqual([]);
  });

  it('returns reviewer actions for a reviewer', () => {
    expect(availableTransitions('SUBMITTED', reviewer).sort()).toEqual(
      ['return_for_changes', 'start_review'].sort(),
    );
    expect(availableTransitions('UNDER_REVIEW', reviewer).sort()).toEqual(
      ['approve', 'reject', 'return_for_changes'].sort(),
    );
  });

  it('returns nothing in terminal states', () => {
    expect(availableTransitions('APPROVED', reviewer)).toEqual([]);
    expect(availableTransitions('REJECTED', reviewer)).toEqual([]);
  });

  it('every returned action actually applies without a Forbidden/Illegal error', () => {
    for (const from of STATUSES) {
      for (const actor of [owner, reviewer]) {
        for (const action of availableTransitions(from, actor)) {
          const comment = actionRequiresComment(from, action) ? 'c' : undefined;
          expect(() => applyTransition(from, action, actor, comment)).not.toThrow();
        }
      }
    }
  });
});

describe('canEdit / isTerminal', () => {
  it('only the owning applicant can edit a DRAFT', () => {
    expect(canEdit('DRAFT', owner)).toBe(true);
    expect(canEdit('DRAFT', otherApplicant)).toBe(false);
    expect(canEdit('DRAFT', reviewer)).toBe(false);
  });

  it('cannot edit once the application leaves DRAFT', () => {
    for (const status of ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as Status[]) {
      expect(canEdit(status, owner)).toBe(false);
    }
  });

  it('isTerminal is true only for APPROVED and REJECTED', () => {
    expect(isTerminal('APPROVED')).toBe(true);
    expect(isTerminal('REJECTED')).toBe(true);
    expect(isTerminal('DRAFT')).toBe(false);
    expect(isTerminal('SUBMITTED')).toBe(false);
    expect(isTerminal('UNDER_REVIEW')).toBe(false);
  });
});
