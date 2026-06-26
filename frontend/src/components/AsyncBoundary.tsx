import type { ReactNode } from 'react';
import { AlertIcon, RetryIcon } from './icons.js';
import { Button } from './Button.js';

interface Props {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  loading: ReactNode;
  empty?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export function AsyncBoundary({
  isLoading,
  isError,
  error,
  isEmpty,
  loading,
  empty,
  onRetry,
  children,
}: Props) {
  if (isLoading) return <>{loading}</>;
  if (isError) {
    return (
      <div className="flex items-start gap-3.5 rounded-xl border border-[#E7C9C5] bg-surface p-7">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FCEBEA] text-[#B42318]">
          <AlertIcon size={19} />
        </span>
        <div className="flex-1">
          <h3 className="font-serif text-[16px] font-medium">Couldn’t load this</h3>
          <p className="mb-3.5 mt-1 text-sm leading-relaxed text-muted">
            {errorMessage(error)}
          </p>
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              <RetryIcon size={14} />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }
  if (isEmpty && empty) return <>{empty}</>;
  return <>{children}</>;
}
