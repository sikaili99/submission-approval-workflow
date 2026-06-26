import type { AuditEntry, Status } from '../api/types.js';
import { RoleBadge, StatusBadge } from './Badge.js';
import { ArrowRightIcon } from './icons.js';
import { formatDate } from '../lib/labels.js';

const ACTION_VERB: Record<string, string> = {
  submit: 'submitted the application',
  start_review: 'started reviewing',
  approve: 'approved the application',
  reject: 'rejected the application',
  return_for_changes: 'returned it for changes',
};

export interface RevisionGroup {
  revision: number;
  entries: AuditEntry[];
}

// The "returned for changes" round-trip is visualized by grouping the audit
// log into revisions: a new revision begins each time the application is
// returned to DRAFT. This reuses the immutable audit trail — no extra storage.
export function groupIntoRevisions(entries: AuditEntry[]): RevisionGroup[] {
  const groups: RevisionGroup[] = [{ revision: 1, entries: [] }];
  for (const entry of entries) {
    groups[groups.length - 1]!.entries.push(entry);
    if (entry.action === 'return_for_changes' && entry.toStatus === 'DRAFT') {
      groups.push({ revision: groups.length + 1, entries: [] });
    }
  }
  return groups.filter((g) => g.entries.length > 0);
}

function dotColor(toStatus: Status): string {
  return {
    DRAFT: '#9CA3AF',
    SUBMITTED: '#3B82F6',
    UNDER_REVIEW: '#F59E0B',
    APPROVED: '#10B981',
    REJECTED: '#EF4444',
  }[toStatus];
}

function Event({ ev, showLine }: { ev: AuditEntry; showLine: boolean }) {
  return (
    <li className="relative pb-6 pl-[38px] last:pb-0">
      {showLine && (
        <span className="absolute bottom-[-2px] left-3 top-[26px] w-0.5 bg-[#EAE9E3]" aria-hidden />
      )}
      <span
        className="absolute left-1 top-[3px] box-border h-[17px] w-[17px] rounded-full border-[2.5px] bg-surface"
        style={{ borderColor: dotColor(ev.toStatus) }}
        aria-hidden
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{ev.actor.name}</span>
        <RoleBadge role={ev.actor.role} />
        <span className="text-sm text-muted">{ACTION_VERB[ev.action] ?? ev.action}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <StatusBadge status={ev.fromStatus} size="sm" />
        <ArrowRightIcon size={15} className="text-[#C4C8CE]" />
        <StatusBadge status={ev.toStatus} size="sm" />
      </div>
      {ev.comment && (
        <div className="mt-2.5 rounded-lg border border-[#EDEFF3] bg-[#FBFBFA] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#26282D]">
          {ev.comment}
        </div>
      )}
      <time className="mt-2 block font-mono text-[11px] text-faint" dateTime={ev.createdAt}>
        {formatDate(ev.createdAt)}
      </time>
    </li>
  );
}

export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  const groups = groupIntoRevisions(entries);
  const multiRevision = groups.length > 1;

  return (
    <div className="rounded-2xl border border-line bg-surface px-6 pb-2 pt-6 shadow-[0_1px_2px_rgba(20,21,26,.04)]">
      {groups.map((group) => (
        <section key={group.revision}>
          {multiRevision && (
            <h3 className="mb-3 flex items-center gap-2">
              <span className="rounded-[5px] bg-[#F0EEE8] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                Revision {group.revision}
              </span>
            </h3>
          )}
          <ol className="relative">
            {group.entries.map((ev, i) => (
              <Event key={ev.id} ev={ev} showLine={i < group.entries.length - 1} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
