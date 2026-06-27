import { describe, expect, it } from 'vitest';
import { groupIntoRevisions } from '../src/components/AuditTimeline.js';
import type { AuditEntry, Status } from '../src/api/types.js';

let seq = 0;
function entry(action: string, from: Status, to: Status): AuditEntry {
  seq += 1;
  return {
    id: `e${seq}`,
    action,
    fromStatus: from,
    toStatus: to,
    comment: null,
    createdAt: '2026-06-20T10:00:00.000Z',
    actor: { id: 'u', name: 'U', role: 'REVIEWER' },
  };
}

describe('groupIntoRevisions (returned-for-changes stretch)', () => {
  it('keeps a single revision when there is no return', () => {
    const groups = groupIntoRevisions([
      entry('submit', 'DRAFT', 'SUBMITTED'),
      entry('start_review', 'SUBMITTED', 'UNDER_REVIEW'),
      entry('approve', 'UNDER_REVIEW', 'APPROVED'),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.revision).toBe(1);
    expect(groups[0]!.entries).toHaveLength(3);
  });

  it('starts a new revision after each return_for_changes to DRAFT', () => {
    const groups = groupIntoRevisions([
      entry('submit', 'DRAFT', 'SUBMITTED'),
      entry('return_for_changes', 'SUBMITTED', 'DRAFT'),
      entry('submit', 'DRAFT', 'SUBMITTED'),
      entry('start_review', 'SUBMITTED', 'UNDER_REVIEW'),
      entry('approve', 'UNDER_REVIEW', 'APPROVED'),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.entries.map((e) => e.action)).toEqual(['submit', 'return_for_changes']);
    expect(groups[1]!.entries.map((e) => e.action)).toEqual(['submit', 'start_review', 'approve']);
  });

  it('returns no groups for an empty trail', () => {
    expect(groupIntoRevisions([])).toEqual([]);
  });
});
