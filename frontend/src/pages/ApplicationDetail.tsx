import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApplication, useTransition } from '../api/hooks.js';
import type { Action } from '../api/types.js';
import { ApiError } from '../api/client.js';
import { AsyncBoundary } from '../components/AsyncBoundary.js';
import { AttachmentPreview } from '../components/AttachmentPreview.js';
import { AuditTimeline } from '../components/AuditTimeline.js';
import { Button } from '../components/Button.js';
import { StatusBadge } from '../components/Badge.js';
import { CommentDialog } from '../components/CommentDialog.js';
import { ArrowLeftIcon, EditIcon, FileIcon, ReturnIcon } from '../components/icons.js';
import { ACTION_META, CATEGORY_LABEL, formatAmount, formatDate, shortId } from '../lib/labels.js';

function DetailSkeleton() {
  return (
    <div>
      <div className="mb-5 rounded-2xl border border-line bg-surface p-6">
        <div className="skel h-6 w-24 rounded-[5px]" />
        <div className="skel mt-3 h-7 w-2/3" />
        <div className="skel mt-4 h-4 w-1/2" />
      </div>
      <div className="skel h-40 rounded-2xl" />
    </div>
  );
}

export function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useApplication(id);
  const transition = useTransition(id ?? '');

  const [dialogAction, setDialogAction] = useState<Action | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function run(action: Action, comment?: string) {
    setActionError(null);
    try {
      await transition.mutateAsync({ action, ...(comment ? { comment } : {}) });
      setDialogAction(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Action failed.';
      setActionError(msg);
      setDialogAction(null);
    }
  }

  function onAction(action: Action) {
    if (ACTION_META[action].requiresComment) {
      setDialogAction(action);
    } else {
      void run(action);
    }
  }

  const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404;

  return (
    <AsyncBoundary
      isLoading={query.isLoading}
      isError={query.isError && !notFound}
      error={query.error}
      onRetry={() => void query.refetch()}
      loading={<DetailSkeleton />}
    >
      {notFound ? (
        <div className="mx-auto mt-10 max-w-[560px] rounded-xl border border-line bg-surface px-8 py-12 text-center">
          <h2 className="font-serif text-xl font-medium">Application not found</h2>
          <p className="mb-4 mt-1.5 text-sm text-muted">
            It may have been removed, or you don’t have access to it.
          </p>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>
      ) : query.data ? (
        (() => {
          const app = query.data;
          const returned = [...app.auditTrail]
            .reverse()
            .find((e) => e.action === 'return_for_changes' && e.toStatus === 'DRAFT');
          const showReturnedCallout = app.status === 'DRAFT' && Boolean(returned);

          return (
            <div>
              <button
                onClick={() => navigate('/')}
                className="focusable mb-3.5 inline-flex items-center gap-1.5 py-1 text-[13px] text-muted hover:text-graphite"
              >
                <ArrowLeftIcon size={15} />
                Back
              </button>

              <div className="mb-5 rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(20,21,26,.04)]">
                <div className="font-mono text-[11px] tracking-[0.1em] text-faint">
                  REQUEST {shortId(app.id).toUpperCase()}
                </div>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <h1 className="font-serif text-[26px] font-medium leading-tight tracking-[-0.015em]">
                    {app.title}
                  </h1>
                  <StatusBadge status={app.status} />
                </div>
                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-5 gap-y-3.5 border-t border-[#EEEDE8] pt-4">
                  <Meta label="Category" value={CATEGORY_LABEL[app.category]} />
                  <Meta label="Amount" value={formatAmount(app.amount)} />
                  <Meta label="Submitted" value={formatDate(app.createdAt)} />
                </div>
                {app.description && (
                  <p className="mt-4 max-w-[620px] whitespace-pre-wrap text-sm leading-relaxed text-[#26282D]">
                    {app.description}
                  </p>
                )}
                {app.attachmentUrl && (
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="focusable mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#FCFCFA] px-3 py-1.5 text-[13px] font-semibold text-graphite hover:border-graphite"
                  >
                    <FileIcon size={15} />
                    {app.attachmentName ?? 'Attachment'}
                  </button>
                )}

                {(app.availableTransitions.length > 0 || app.canEdit) && (
                  <div className="mt-5 flex flex-wrap gap-2.5 border-t border-[#EEEDE8] pt-[18px]">
                    {app.availableTransitions.map((action) => (
                      <Button
                        key={action}
                        variant={ACTION_META[action].variant}
                        onClick={() => onAction(action)}
                        disabled={transition.isPending}
                      >
                        {action === 'return_for_changes' && <ReturnIcon size={15} />}
                        {ACTION_META[action].label}
                      </Button>
                    ))}
                    {app.canEdit && (
                      <Button variant="secondary" onClick={() => navigate(`/applications/${app.id}/edit`)}>
                        <EditIcon size={15} />
                        Edit draft
                      </Button>
                    )}
                  </div>
                )}

                {actionError && (
                  <p role="alert" className="mt-3 text-sm text-[#B42318]">
                    {actionError}
                  </p>
                )}
              </div>

              {showReturnedCallout && returned && (
                <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4.5 px-[18px] py-4">
                  <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <ReturnIcon size={16} />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-800">
                      Returned for changes by {returned.actor.name}
                    </h3>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-amber-900/80">
                      {returned.comment}
                    </p>
                    {app.canEdit && (
                      <button
                        onClick={() => navigate(`/applications/${app.id}/edit`)}
                        className="focusable mt-2.5 inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-amber-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-amber-800 hover:bg-amber-50"
                      >
                        Edit and resubmit
                      </button>
                    )}
                  </div>
                </div>
              )}

              <h2 className="mb-3.5 ml-0.5 mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Activity log
              </h2>
              {app.auditTrail.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D8D6CF] bg-surface px-6 py-9 text-center">
                  <p className="text-[13.5px] text-muted">
                    No activity yet. Once this draft is submitted, every status change will appear
                    here as a permanent, time-stamped record.
                  </p>
                </div>
              ) : (
                <AuditTimeline entries={app.auditTrail} />
              )}

              <CommentDialog
                open={dialogAction !== null}
                title={dialogAction ? ACTION_META[dialogAction].label : ''}
                description={
                  dialogAction === 'reject'
                    ? 'Explain why this application is being rejected. The applicant will see this.'
                    : 'Tell the applicant what needs to change before resubmitting.'
                }
                confirmLabel={dialogAction ? ACTION_META[dialogAction].label : 'Confirm'}
                confirmVariant={dialogAction === 'reject' ? 'danger' : 'primary'}
                pending={transition.isPending}
                onConfirm={(comment) => dialogAction && void run(dialogAction, comment)}
                onClose={() => setDialogAction(null)}
              />

              {app.attachmentUrl && (
                <AttachmentPreview
                  open={previewOpen}
                  url={app.attachmentUrl}
                  name={app.attachmentName ?? 'Attachment'}
                  onClose={() => setPreviewOpen(false)}
                />
              )}
            </div>
          );
        })()
      ) : null}
    </AsyncBoundary>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-1 text-[13.5px] font-medium text-[#26282D]">{value}</div>
    </div>
  );
}
