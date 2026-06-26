import type { Action, Category, Role, Status } from '../api/types.js';

export const STATUS_LABEL: Record<Status, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  GRANT: 'Grant',
  EXPENSE: 'Expense',
  EQUIPMENT: 'Equipment',
  TRAVEL: 'Travel',
  OTHER: 'Other',
};

export const ROLE_LABEL: Record<Role, string> = {
  APPLICANT: 'Applicant',
  REVIEWER: 'Reviewer',
};

interface ActionMeta {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  requiresComment: boolean;
}

export const ACTION_META: Record<Action, ActionMeta> = {
  submit: { label: 'Submit', variant: 'primary', requiresComment: false },
  start_review: { label: 'Start review', variant: 'primary', requiresComment: false },
  approve: { label: 'Approve', variant: 'primary', requiresComment: false },
  reject: { label: 'Reject', variant: 'danger', requiresComment: true },
  return_for_changes: {
    label: 'Return for changes',
    variant: 'secondary',
    requiresComment: true,
  },
};

export function formatAmount(amount: string | null): string {
  if (amount === null) return '—';
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function shortId(id: string): string {
  return `#${id.slice(0, 8)}`;
}
