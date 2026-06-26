import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { ArrowRightIcon, CheckIcon, FileIcon } from '../components/icons.js';

const APPLICANT_TOKEN = 'demo-applicant-token';
const REVIEWER_TOKEN = 'demo-reviewer-token';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function attempt(token: string) {
    setError(false);
    setBusy(true);
    try {
      await login(token);
      navigate('/');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{ background: 'radial-gradient(120% 90% at 50% 0%, #F2F0EA 0%, #FBFAF7 55%)' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-graphite">
            <CheckIcon size={19} className="text-paper" />
          </span>
          <span className="text-xl font-bold tracking-tight">Workflow</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-[0_20px_50px_-34px_rgba(20,21,26,.25)]">
          <h1 className="font-serif text-xl font-medium tracking-tight">Sign in to continue</h1>
          <p className="mb-6 mt-1.5 text-sm leading-relaxed text-muted">
            Choose a seeded identity for the demo. The app stores your token and routes you by
            role.
          </p>

          <button
            disabled={busy}
            onClick={() => void attempt(APPLICANT_TOKEN)}
            className="focusable mb-3 flex w-full items-center gap-3 rounded-xl border border-graphite bg-graphite p-4 text-left text-paper transition-colors hover:bg-graphite-soft disabled:opacity-60"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] bg-white/15">
              <FileIcon size={19} className="text-paper" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">Continue as Applicant</span>
              <span className="mt-0.5 block text-xs opacity-80">
                Submit applications and track status
              </span>
            </span>
            <ArrowRightIcon size={18} className="text-paper/85" />
          </button>

          <button
            disabled={busy}
            onClick={() => void attempt(REVIEWER_TOKEN)}
            className="focusable flex w-full items-center gap-3 rounded-xl border border-[#D8D6CF] bg-surface p-4 text-left transition-colors hover:border-graphite disabled:opacity-60"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] bg-[#F0EEE8]">
              <CheckIcon size={19} className="text-graphite" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">Continue as Reviewer</span>
              <span className="mt-0.5 block text-xs text-muted">
                Triage the queue, approve or return
              </span>
            </span>
            <ArrowRightIcon size={18} className="text-faint" />
          </button>

          <details className="mt-[18px]">
            <summary className="inline-flex cursor-pointer select-none items-center gap-1.5 text-[13px] text-muted">
              Or paste a token
            </summary>
            <div className="mt-3">
              <label htmlFor="token" className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Bearer token
              </label>
              <div className="flex gap-2">
                <input
                  id="token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="demo-applicant-token"
                  className="flex-1 rounded-lg border border-[#D8D6CF] px-3 py-2 font-mono text-[13px]"
                />
                <button
                  disabled={busy || tokenInput.trim() === ''}
                  onClick={() => void attempt(tokenInput.trim())}
                  className="focusable whitespace-nowrap rounded-lg border border-graphite bg-graphite px-3.5 py-2 text-[13px] font-semibold text-paper hover:bg-graphite-soft disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
              {error && (
                <p role="alert" className="mt-2 text-xs text-[#B42318]">
                  That token isn’t recognized. Try{' '}
                  <code className="font-mono">demo-applicant-token</code> or{' '}
                  <code className="font-mono">demo-reviewer-token</code>.
                </p>
              )}
            </div>
          </details>
        </div>
        <p className="mt-5 text-center font-mono text-[11px] tracking-[0.04em] text-faint">
          Internal submission &amp; approval workflow · demo environment
        </p>
      </div>
    </div>
  );
}
