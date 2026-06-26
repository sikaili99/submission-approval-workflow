import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button.js';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  pending?: boolean;
  onConfirm: (comment: string) => void;
  onClose: () => void;
}

export function CommentDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  pending = false,
  onConfirm,
  onClose,
}: Props) {
  const [comment, setComment] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const labelId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      setComment('');
      // Focus the textarea once the dialog has mounted.
      requestAnimationFrame(() => textareaRef.current?.focus());
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
          'button, textarea, [href], input, select, [tabindex]:not([tabindex="-1"])',
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

  const trimmed = comment.trim();
  const canConfirm = trimmed.length > 0 && !pending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
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
        aria-describedby={descId}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
        style={{ animation: 'dialog-in .18s ease both' }}
      >
        <h2 id={labelId} className="font-serif text-xl font-medium tracking-tight">
          {title}
        </h2>
        <p id={descId} className="mt-1 text-sm leading-relaxed text-muted">
          {description}
        </p>
        <label htmlFor="comment-field" className="mt-4 block text-sm font-semibold text-[#374151]">
          Comment <span className="text-[#B42318]">*</span>
        </label>
        <textarea
          id="comment-field"
          ref={textareaRef}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-lg border border-[#D8D6CF] px-3 py-2.5 text-sm leading-relaxed"
          placeholder="Explain what needs to change or why…"
        />
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            disabled={!canConfirm}
            onClick={() => onConfirm(trimmed)}
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
