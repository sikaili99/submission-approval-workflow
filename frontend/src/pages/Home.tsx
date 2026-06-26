import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '../api/hooks.js';
import type { Status } from '../api/types.js';
import { useAuth } from '../auth/AuthContext.js';
import { AsyncBoundary } from '../components/AsyncBoundary.js';
import { Button } from '../components/Button.js';
import { StatusBadge } from '../components/Badge.js';
import { FileIcon, PlusIcon } from '../components/icons.js';
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  formatAmount,
  formatRelative,
  shortId,
} from '../lib/labels.js';

const FILTERS: Array<{ value: Status | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: STATUS_LABEL.SUBMITTED },
  { value: 'UNDER_REVIEW', label: STATUS_LABEL.UNDER_REVIEW },
  { value: 'APPROVED', label: STATUS_LABEL.APPROVED },
  { value: 'REJECTED', label: STATUS_LABEL.REJECTED },
];

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {[38, 52, 44, 60].map((w, i) => (
        <div key={i} className="flex gap-4 border-b border-[#F1F0EB] px-5 py-4 last:border-0">
          <div className="skel h-3.5" style={{ width: `${w}%` }} />
          <div className="skel ml-auto h-3.5 w-[90px]" />
          <div className="skel h-[22px] w-[78px] rounded-[5px]" />
        </div>
      ))}
    </div>
  );
}

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isReviewer = user?.role === 'REVIEWER';
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL');

  const query = useApplications(isReviewer ? filter : 'ALL');
  const rows = query.data ?? [];

  const title = isReviewer ? 'Review queue' : 'My applications';
  const subtitle = isReviewer
    ? 'Open an application to review and decide.'
    : 'Track every application you’ve created and its status.';

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.015em]">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {!isReviewer && (
          <Button onClick={() => navigate('/new')}>
            <PlusIcon size={16} />
            New application
          </Button>
        )}
      </div>

      {isReviewer && (
        <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                aria-pressed={active}
                className={`focusable rounded-[7px] border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? 'border-graphite bg-graphite text-paper'
                    : 'border-line bg-surface text-muted hover:border-graphite'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={rows.length === 0}
        onRetry={() => void query.refetch()}
        loading={<ListSkeleton />}
        empty={
          <div className="rounded-xl border border-dashed border-[#D8D6CF] bg-surface px-8 py-14 text-center">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EEE8] text-graphite">
              <FileIcon size={24} />
            </span>
            <h3 className="font-serif text-lg font-medium">
              {isReviewer ? 'Nothing in the queue' : 'No applications yet'}
            </h3>
            <p className="mx-auto mb-4 mt-1.5 max-w-[340px] text-sm leading-relaxed text-muted">
              {isReviewer
                ? 'Applications submitted by applicants will appear here for review.'
                : 'Create your first application to get started — it begins as a draft you can edit.'}
            </p>
            {!isReviewer && (
              <Button onClick={() => navigate('/new')}>
                <PlusIcon size={16} />
                Create your first application
              </Button>
            )}
          </div>
        }
      >
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(20,21,26,.04)]">
          <div
            className="grid gap-4 border-b border-[#EEEDE8] bg-[#FCFCFA] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint"
            style={{ gridTemplateColumns: isReviewer ? '1.6fr 1fr 1fr .8fr 1fr .8fr' : '2fr 1fr .8fr 1fr .8fr' }}
          >
            <span>Application</span>
            {isReviewer && <span>Applicant</span>}
            <span>Category</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span className="text-right">Updated</span>
          </div>
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => navigate(`/applications/${row.id}`)}
              className="focusable grid w-full items-center gap-4 border-b border-[#F1F0EB] bg-surface px-5 py-4 text-left transition-colors last:border-0 hover:bg-[#FCFBF8]"
              style={{ gridTemplateColumns: isReviewer ? '1.6fr 1fr 1fr .8fr 1fr .8fr' : '2fr 1fr .8fr 1fr .8fr' }}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{row.title}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-faint">{shortId(row.id)}</span>
              </span>
              {isReviewer && (
                <span className="truncate text-[13px] text-muted">{row.ownerId.slice(0, 8)}…</span>
              )}
              <span className="text-[13px] text-muted">{CATEGORY_LABEL[row.category]}</span>
              <span className="text-right font-mono text-[13px] font-medium tabular-nums">
                {formatAmount(row.amount)}
              </span>
              <span>
                <StatusBadge status={row.status} />
              </span>
              <span className="whitespace-nowrap text-right font-mono text-[11.5px] text-faint">
                {formatRelative(row.updatedAt)}
              </span>
            </button>
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
}
