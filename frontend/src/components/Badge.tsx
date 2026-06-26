import type { Role, Status } from '../api/types.js';
import { ROLE_LABEL, STATUS_LABEL } from '../lib/labels.js';

// Editorial status pill: mono, uppercase, with a status dot — matching the
// landing page's design language.
const STATUS_PILL: Record<Status, { bg: string; fg: string; dot: string }> = {
  DRAFT: { bg: '#F1F1ED', fg: '#6B6F76', dot: '#A8ACB2' },
  SUBMITTED: { bg: '#EAF1FD', fg: '#1D4FD7', dot: '#3B82F6' },
  UNDER_REVIEW: { bg: '#FBF2E2', fg: '#A66A06', dot: '#E0930E' },
  APPROVED: { bg: '#E8F3EC', fg: '#15803D', dot: '#1FA34A' },
  REJECTED: { bg: '#FCEBEA', fg: '#B42318', dot: '#E5544B' },
};

export function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' }) {
  const c = STATUS_PILL[status];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[9.5px]' : 'px-2.5 py-1 text-[10.5px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[5px] font-mono font-medium uppercase tracking-[0.05em] ${pad}`}
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center rounded-[5px] border border-line px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
      {ROLE_LABEL[role]}
    </span>
  );
}
