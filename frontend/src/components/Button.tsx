import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-graphite text-paper border border-graphite hover:bg-graphite-soft hover:border-graphite-soft',
  secondary: 'bg-surface text-graphite border border-[#D8D6CF] hover:border-graphite',
  danger: 'bg-surface text-[#B42318] border border-[#E7C9C5] hover:bg-[#FCF3F2]',
  ghost: 'bg-transparent text-muted border-none hover:text-graphite',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      className={`focusable inline-flex items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
