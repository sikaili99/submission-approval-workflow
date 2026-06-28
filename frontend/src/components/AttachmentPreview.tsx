import { useEffect, useId, useRef } from 'react';
import { CloseIcon, FileIcon } from './icons.js';

interface Props {
  open: boolean;
  url: string;
  name: string;
  onClose: () => void;
}

type Kind = 'image' | 'pdf' | 'other';

function kindFromName(name: string, url: string): Kind {
  const ext = (name || url).split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

export function AttachmentPreview({ open, url, name, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const labelId = useId();
  const kind = kindFromName(name, url);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => closeRef.current?.focus());
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, a[href], iframe, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      style={{ animation: 'overlay-in .15s ease both' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        style={{ animation: 'dialog-in .18s ease both' }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <span id={labelId} className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <FileIcon size={16} className="flex-shrink-0 text-graphite" />
            <span className="truncate">{name || 'Attachment'}</span>
          </span>
          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="focusable rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-graphite hover:border-graphite"
            >
              Open in new tab
            </a>
            <a
              href={url}
              download={name || true}
              className="focusable rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-graphite hover:border-graphite"
            >
              Download
            </a>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close preview"
              className="focusable flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-[#F0EEE8] hover:text-graphite"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        <div className="flex min-h-[200px] flex-1 items-center justify-center overflow-auto bg-[#F6F4EF] p-4">
          {kind === 'image' && (
            <img
              src={url}
              alt={name || 'Attachment preview'}
              className="max-h-[72vh] max-w-full rounded object-contain"
            />
          )}
          {kind === 'pdf' && (
            <iframe src={url} title={name || 'PDF preview'} className="h-[72vh] w-full rounded border-0" />
          )}
          {kind === 'other' && (
            <p className="px-4 py-10 text-center text-sm text-muted">
              This file type can’t be previewed here. Use{' '}
              <span className="font-semibold">Open in new tab</span> or{' '}
              <span className="font-semibold">Download</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
