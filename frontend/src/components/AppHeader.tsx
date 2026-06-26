import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { ROLE_LABEL } from '../lib/labels.js';
import { CheckIcon, SignOutIcon } from './icons.js';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-[58px] max-w-[1120px] items-center gap-3 px-6">
        <button onClick={() => navigate('/')} className="focusable flex items-center gap-2.5">
          <span className="flex h-[27px] w-[27px] items-center justify-center rounded-[7px] bg-graphite">
            <CheckIcon size={15} className="text-paper" />
          </span>
          <span className="text-[17px] font-bold tracking-tight">Workflow</span>
          <span className="font-mono text-xs text-faint">/ requests</span>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <span className="hidden text-[13px] font-semibold sm:inline">{user.name}</span>
          <span className="rounded-[5px] border border-line px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">
            {ROLE_LABEL[user.role]}
          </span>
          <span
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: '#E8F3EC', color: '#15803D' }}
            aria-hidden
          >
            {initials(user.name)}
          </span>
          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="focusable flex h-7 w-7 items-center justify-center rounded-full text-faint transition-colors hover:bg-[#F0EEE8] hover:text-[#B42318]"
          >
            <SignOutIcon size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
