import type { ReactNode } from 'react';

export function Logo({ size = 27, light = false }: { size?: number; light?: boolean }) {
  return (
    <span
      className="flex items-center justify-center rounded-[7px]"
      style={{
        width: size,
        height: size,
        background: light ? '#FBFAF7' : '#16171B',
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke={light ? '#16171B' : '#FBFAF7'}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4.5 12.5l4.8 4.8L19.5 7" />
      </svg>
    </span>
  );
}

export function ArrowRight() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

type Tone = 'approved' | 'review' | 'submitted' | 'draft';

const PILL: Record<Tone, { bg: string; fg: string; dot: string; label: string }> = {
  approved: { bg: '#E8F3EC', fg: '#15803D', dot: '#1FA34A', label: 'APPROVED' },
  review: { bg: '#FBF2E2', fg: '#A66A06', dot: '#E0930E', label: 'UNDER_REVIEW' },
  submitted: { bg: '#EAF1FD', fg: '#1D4FD7', dot: '#3B82F6', label: 'SUBMITTED' },
  draft: { bg: '#F1F1ED', fg: '#6B6F76', dot: '#A8ACB2', label: 'DRAFT' },
};

export function StatusPill({ tone, label }: { tone: Tone; label?: string }) {
  const p = PILL[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 font-mono text-[10.5px] font-medium tracking-wide"
      style={{ background: p.bg, color: p.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.dot }} />
      {label ?? p.label}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-xs tracking-[0.14em] text-[#9AA0A6]">{children}</div>
  );
}
