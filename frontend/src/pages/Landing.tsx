import { Link } from 'react-router-dom';
import { useScrollReveal } from '../landing/useScrollReveal.js';
import {
  ArrowRight,
  GitHubMark,
  Logo,
  SectionLabel,
  StatusPill,
} from '../landing/parts.js';

const GITHUB_URL = 'https://github.com';

const FEATURES = [
  {
    title: 'Enforced workflow',
    body: 'Illegal transitions are blocked server-side. The state machine is the source of truth — not the UI, and not a hopeful client.',
    icon: (
      <path d="M12 3l7 2.6v5.2c0 4.3-2.9 7-7 8.2-4.1-1.2-7-3.9-7-8.2V5.6L12 3Z M9 11.5l2.2 2.2L15.5 9" />
    ),
  },
  {
    title: 'Immutable audit trail',
    body: 'Every change is recorded: who, what, when, and why. Entries are append-only — never edited, never quietly deleted.',
    icon: <path d="M3 12a9 9 0 1 0 3-6.7L3 8 M3 4v4h4 M12 7.5V12l3 1.8" />,
  },
  {
    title: 'Role-based access',
    body: 'Applicants and reviewers see exactly what they should — nothing more, nothing less. Permissions are checked on every action.',
    icon: (
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19 M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4 M15.5 5.1a3.2 3.2 0 0 1 0 5.8" />
    ),
  },
  {
    title: 'Validated forms',
    body: 'Inline validation catches problems before submission, not after. Reviewers get complete, well-formed requests every time.',
    icon: (
      <path d="M6 4h12v16H6z M9.2 12.5l1.8 1.8 3.8-3.8" />
    ),
  },
  {
    title: 'Clear errors',
    body: 'Plain-language messages tell you what went wrong and how to fix it — no codes, no dead ends, no guesswork.',
    icon: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7.5v5 M12 16.2h.01" />,
  },
  {
    title: 'Reproducible setup',
    body: 'One command to run. Deterministic seeds mean the same data every time — easy to demo, easy to review, easy to trust.',
    icon: (
      <path d="M20 7a8 8 0 0 0-14-2.5L4 7 M4 4v3h3 M4 17a8 8 0 0 0 14 2.5L20 17 M20 20v-3h-3" />
    ),
  },
];

const STEPS = [
  {
    n: '01',
    tone: 'submitted' as const,
    title: 'Submit',
    body: 'An applicant fills a validated request and submits it. It enters the queue — visible to reviewers, locked from edits.',
  },
  {
    n: '02',
    tone: 'review' as const,
    title: 'Review',
    body: 'A reviewer claims it. The status moves to under review and ownership is clear — one decision-maker, no ambiguity.',
  },
  {
    n: '03',
    tone: 'approved' as const,
    title: 'Decide',
    body: 'Approve, or send it back with a comment. The outcome is written to the record forever — approved or rejected.',
  },
];

const AUDIT = [
  { who: 'System', when: 'Jun 18 · 09:14', change: 'created → DRAFT', note: null, fg: '#6B6F76' },
  { who: 'Aisha Mensah', when: 'Jun 18 · 09:21', change: 'DRAFT → SUBMITTED', note: 'Submitted for review.', fg: '#6B6F76' },
  { who: 'Tunde Okonkwo', when: 'Jun 18 · 11:02', change: 'SUBMITTED → UNDER_REVIEW', note: 'Picked up — verifying receipts.', fg: '#6B6F76' },
  { who: 'Tunde Okonkwo', when: 'Jun 19 · 14:37', change: 'UNDER_REVIEW → APPROVED', note: 'Receipts verified, within policy.', fg: '#15803D' },
];

const navLink =
  'rounded-[7px] px-3 py-2 text-sm font-medium text-[#43474E] no-underline transition-colors hover:bg-[#F0EEE8] hover:text-graphite';

export function Landing() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-paper font-grotesk text-graphite" id="top">
      {/* NAV */}
      <header>
        <nav
          data-nav
          aria-label="Primary"
          className="sticky top-0 z-50 w-full border-b border-transparent transition-[background,border-color] duration-200"
        >
          <div className="mx-auto flex h-[66px] w-full max-w-[1120px] items-center justify-between gap-5 px-6">
            <a href="#top" aria-label="Workflow home" className="inline-flex items-center gap-2.5 text-inherit no-underline">
              <Logo />
              <span className="text-[17px] font-bold tracking-tight">Workflow</span>
            </a>
            <div className="flex flex-wrap items-center gap-1">
              <a href="#features" className={navLink}>Capabilities</a>
              <a href="#how" className={navLink}>How it works</a>
              <a href="#audit" className={navLink}>The record</a>
              <Link to="/login" className={`${navLink} ml-1.5 font-semibold text-graphite`}>
                Sign in
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-graphite px-4 py-2.5 text-sm font-semibold text-paper no-underline transition-colors hover:bg-[#33353B]"
              >
                Open the app
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="px-0 pb-[84px] pt-[60px]">
          <div className="mx-auto w-full max-w-[1120px] px-6">
            <div className="max-w-[780px]" data-reveal>
              <h1 className="m-0 font-serif text-[clamp(2.7rem,6vw,4.6rem)] font-medium leading-[1.0] tracking-[-0.02em]">
                Approvals you can <em className="font-medium italic">prove</em>.
              </h1>
              <p className="m-0 mt-6 max-w-[33em] text-[clamp(1.08rem,1.5vw,1.3rem)] leading-[1.55] text-[#52565D]">
                Workflow routes every request through review and writes an immutable record of who
                decided what, when, and why. Role-based, server-enforced, audit-ready.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2.5 rounded-[10px] bg-graphite px-6 py-3.5 text-[15.5px] font-semibold text-paper no-underline transition hover:-translate-y-0.5 hover:bg-[#33353B]"
                >
                  Open the app
                  <ArrowRight />
                </Link>
                <a
                  href={GITHUB_URL}
                  className="inline-flex items-center gap-2.5 rounded-[10px] border border-[#D8D6CF] bg-paper px-5 py-3.5 text-[15.5px] font-semibold text-graphite no-underline transition hover:border-graphite hover:bg-white"
                >
                  <GitHubMark />
                  View on GitHub
                </a>
              </div>
              <div className="mt-6 font-mono text-xs tracking-[0.04em] text-[#9AA0A6]">
                Role-based access&nbsp;&nbsp;·&nbsp;&nbsp;Immutable audit trail&nbsp;&nbsp;·&nbsp;&nbsp;Server-enforced states
              </div>
            </div>

            {/* PRODUCT MOCK */}
            <div className="mt-[54px]" data-reveal data-reveal-delay="120">
              <div className="mx-auto w-full max-w-[1080px] overflow-hidden rounded-[15px] border border-[#E5E3DC] bg-white shadow-[0_50px_90px_-50px_rgba(20,21,26,.32),0_10px_30px_-20px_rgba(20,21,26,.18)]">
                <div className="flex h-[52px] items-center justify-between gap-3.5 border-b border-[#EEEDE8] bg-[#FCFCFA] px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Logo size={22} />
                    <span className="text-sm font-bold tracking-tight">Workflow</span>
                    <span className="font-mono text-xs text-[#AEB2B8]">/ requests</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-[5px] border border-[#E5E3DC] px-2 py-[3px] font-mono text-[10.5px] tracking-wide text-[#6B6F76]">
                      REVIEWER
                    </span>
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#E8F3EC] text-[11px] font-bold text-[#15803D]">
                      TO
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-stretch">
                  {/* queue rail */}
                  <div className="min-w-[220px] max-w-[264px] flex-1 border-r border-[#EEEDE8] bg-[#FCFCFA] p-3">
                    <div className="px-2 pb-2.5 pt-1 font-mono text-[10px] tracking-[0.14em] text-[#AEB2B8]">
                      REVIEW QUEUE · 5
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="rounded-lg border border-[#E5E3DC] bg-[#F1F0EB] p-2.5">
                        <div className="text-[13px] font-semibold">Travel reimbursement</div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-[#9AA0A6]">#4821 · A. Mensah</span>
                          <StatusPill tone="approved" label="APPROVED" />
                        </div>
                      </div>
                      {[
                        { t: 'Vendor onboarding', id: '#4830 · K. Banda', tone: 'review' as const, label: 'REVIEW' },
                        { t: 'Budget increase', id: '#4833 · L. Phiri', tone: 'submitted' as const, label: 'SUBMITTED' },
                        { t: 'Equipment request', id: '#4835 · N. Daka', tone: 'submitted' as const, label: 'SUBMITTED' },
                        { t: 'Contract renewal', id: '#4818 · J. Tembo', tone: 'draft' as const, label: 'DRAFT' },
                      ].map((r) => (
                        <div key={r.t} className="rounded-lg p-2.5">
                          <div className="text-[13px] font-medium text-[#3B3F46]">{r.t}</div>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-[#9AA0A6]">{r.id}</span>
                            <StatusPill tone={r.tone} label={r.label} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* detail */}
                  <div className="min-w-[300px] flex-1 px-6 pb-5 pt-[22px]">
                    <div className="flex flex-wrap items-start justify-between gap-3.5">
                      <div>
                        <div className="font-mono text-[11px] tracking-[0.1em] text-[#AEB2B8]">REQUEST #4821</div>
                        <div className="mt-0.5 text-[19px] font-semibold tracking-[-0.01em]">Travel reimbursement</div>
                      </div>
                      <StatusPill tone="approved" label="APPROVED" />
                    </div>
                    <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-5 gap-y-3.5 border-b border-[#EEEDE8] pb-5">
                      {[
                        ['REQUESTER', 'Aisha Mensah', '#26282D'],
                        ['SUBMITTED', 'Jun 18, 09:21', '#26282D'],
                        ['AMOUNT', '$1,200.00', '#26282D'],
                        ['POLICY', 'Within limit', '#15803D'],
                      ].map(([k, v, c]) => (
                        <div key={k}>
                          <div className="font-mono text-[10px] tracking-[0.1em] text-[#AEB2B8]">{k}</div>
                          <div className="mt-1 text-[13.5px] font-medium" style={{ color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 font-mono text-[10px] tracking-[0.14em] text-[#AEB2B8]">ACTIVITY</div>
                    <div className="mt-3.5">
                      {AUDIT.map((e, i) => (
                        <div key={i} className="flex gap-3.5">
                          <div className="flex flex-col items-center">
                            <span
                              className="mt-0.5 h-[9px] w-[9px] flex-none rounded-full"
                              style={{
                                background:
                                  e.change.includes('APPROVED') ? '#1FA34A'
                                  : e.change.includes('UNDER_REVIEW') ? '#E0930E'
                                  : e.change.includes('SUBMITTED') ? '#3B82F6'
                                  : '#A8ACB2',
                                boxShadow: i === AUDIT.length - 1 ? '0 0 0 3px #E8F3EC' : undefined,
                              }}
                            />
                            {i < AUDIT.length - 1 && <span className="min-h-[22px] w-[1.5px] flex-1 bg-[#EAE9E3]" />}
                          </div>
                          <div className="pb-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                              <span className="text-[13px] font-semibold">{e.who}</span>
                              <span className="font-mono text-[11px] text-[#AEB2B8]">{e.when}</span>
                            </div>
                            <div className="mt-1 font-mono text-[10.5px]" style={{ color: e.fg }}>
                              {e.change}
                            </div>
                            {e.note && <div className="mt-1 text-[12.5px] text-[#52565D]">{e.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="border-t border-[#E8E6E0] py-24">
          <div className="mx-auto w-full max-w-[1120px] px-6">
            <div className="max-w-[740px]" data-reveal>
              <SectionLabel>01 — CAPABILITIES</SectionLabel>
              <h2 className="m-0 mt-4 font-serif text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.06] tracking-[-0.015em]">
                Opinionated where it matters. Quiet everywhere else.
              </h2>
              <p className="m-0 mt-4 text-[clamp(1.02rem,1.4vw,1.18rem)] leading-[1.55] text-[#52565D]">
                The rules live on the server, so the workflow stays honest no matter what the client does.
              </p>
            </div>
            <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  data-reveal
                  data-reveal-delay={(i % 3) * 80}
                  className="rounded-xl border border-[#E8E6E0] bg-white p-[26px] transition hover:-translate-y-0.5 hover:border-graphite"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16171B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {f.icon}
                  </svg>
                  <h3 className="m-0 mt-4 text-[16.5px] font-semibold tracking-[-0.01em]">{f.title}</h3>
                  <p className="m-0 mt-2.5 text-[14.5px] leading-[1.55] text-[#52565D]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="border-t border-[#E8E6E0] bg-[#F6F4EF] py-24">
          <div className="mx-auto w-full max-w-[1120px] px-6">
            <div className="max-w-[740px]" data-reveal>
              <SectionLabel>02 — HOW IT WORKS</SectionLabel>
              <h2 className="m-0 mt-4 font-serif text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.06] tracking-[-0.015em]">
                From request to decision in three moves.
              </h2>
            </div>
            <div className="mt-11 flex flex-wrap items-stretch gap-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  data-reveal
                  data-reveal-delay={i * 110}
                  className="flex-1 basis-[280px] rounded-xl border border-[#E8E6E0] bg-white p-7"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[13px] font-medium tracking-[0.06em] text-[#AEB2B8]">{s.n}</span>
                    <StatusPill tone={s.tone} />
                  </div>
                  <h3 className="m-0 mt-[18px] text-[19px] font-semibold tracking-[-0.015em]">{s.title}</h3>
                  <p className="m-0 mt-2.5 text-[14.5px] leading-[1.55] text-[#52565D]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE RECORD */}
        <section id="audit" className="border-t border-[#E8E6E0] py-24">
          <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-start gap-14 px-6">
            <div className="min-w-[300px] flex-1 basis-[340px]" data-reveal>
              <SectionLabel>03 — THE RECORD</SectionLabel>
              <h2 className="m-0 mt-4 font-serif text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.06] tracking-[-0.015em]">
                A trail you can defend.
              </h2>
              <p className="m-0 mt-4 max-w-[32em] text-[clamp(1.02rem,1.4vw,1.18rem)] leading-[1.55] text-[#52565D]">
                Every state change writes a single, immutable line — who acted, what changed, when,
                and why. Nothing is edited after the fact. Nothing disappears.
              </p>
              <div className="mt-6 flex flex-col gap-3.5">
                {[
                  ['Append-only', 'entries are never edited or deleted.'],
                  ['Strictly ordered', 'sequenced by server timestamp.'],
                  ['Exportable', 'ready for compliance review on demand.'],
                ].map(([strong, rest]) => (
                  <div key={strong} className="flex items-start gap-3">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#16171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    <span className="text-[15px] leading-[1.5] text-[#26282D]">
                      <strong className="font-semibold">{strong}</strong> — {rest}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-[300px] flex-1 basis-[440px]" data-reveal data-reveal-delay="120">
              <div className="overflow-hidden rounded-[14px] border border-[#E8E6E0] bg-white shadow-[0_20px_50px_-34px_rgba(20,21,26,.22)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#EEEDE8] bg-[#FCFCFA] px-[18px] py-[15px]">
                  <span className="font-mono text-[11.5px] tracking-[0.1em] text-[#6B6F76]">ACTIVITY LOG · #4821</span>
                  <StatusPill tone="approved" label="APPROVED" />
                </div>
                <div className="px-[18px] pb-2 pt-1.5">
                  {AUDIT.map((e, i) => (
                    <div
                      key={i}
                      className={`py-[15px] ${i < AUDIT.length - 1 ? 'border-b border-[#F1F0EB]' : ''}`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                        <span className="text-[13.5px] font-semibold">{e.who}</span>
                        <span className="font-mono text-[11.5px] text-[#AEB2B8]">{e.when}</span>
                      </div>
                      <div className="mt-1.5 font-mono text-[11px]" style={{ color: e.fg }}>{e.change}</div>
                      {e.note && <div className="mt-1.5 text-[13px] text-[#52565D]">{e.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA + FOOTER */}
        <section className="bg-graphite text-paper">
          <div className="mx-auto w-full max-w-[1120px] px-6">
            <div className="mx-auto max-w-[680px] py-[clamp(64px,10vw,108px)] text-center" data-reveal>
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#7E828A]">Open the app</div>
              <h2 className="m-0 mt-4 font-serif text-[clamp(2.2rem,4.6vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.02em] text-paper">
                Put your approvals on the record.
              </h2>
              <p className="mx-auto m-0 mt-[18px] max-w-[34em] text-[clamp(1.02rem,1.4vw,1.2rem)] leading-[1.55] text-[#A4A8AF]">
                Walk a request from draft to decision and see the whole trail, start to finish.
              </p>
              <div className="mt-[30px] flex flex-wrap justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2.5 rounded-[10px] bg-paper px-[26px] py-3.5 text-[15.5px] font-semibold text-graphite no-underline transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Open the app
                  <ArrowRight />
                </Link>
                <a
                  href={GITHUB_URL}
                  className="inline-flex items-center gap-2.5 rounded-[10px] border border-paper/30 bg-transparent px-5 py-3.5 text-[15.5px] font-semibold text-paper no-underline transition hover:border-paper/60 hover:bg-paper/5"
                >
                  View on GitHub
                </a>
              </div>
            </div>

            <footer className="border-t border-paper/10 pb-11 pt-10">
              <div className="flex flex-wrap items-start justify-between gap-8">
                <div className="max-w-[300px]">
                  <span className="inline-flex items-center gap-2.5">
                    <Logo size={26} light />
                    <span className="text-base font-bold tracking-tight">Workflow</span>
                  </span>
                  <p className="m-0 mt-3.5 text-[13.5px] leading-[1.55] text-[#8E929A]">
                    Submit, review, approve — with a trail you can trust.
                  </p>
                </div>
                <div className="flex flex-wrap gap-12">
                  <div className="flex flex-col gap-2.5">
                    <div className="font-mono text-[10.5px] tracking-[0.12em] text-[#62666E]">PRODUCT</div>
                    <a href="#features" className="text-sm text-[#C2C5CB] no-underline hover:text-paper">Capabilities</a>
                    <a href="#how" className="text-sm text-[#C2C5CB] no-underline hover:text-paper">How it works</a>
                    <a href="#audit" className="text-sm text-[#C2C5CB] no-underline hover:text-paper">The record</a>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="font-mono text-[10.5px] tracking-[0.12em] text-[#62666E]">GET STARTED</div>
                    <Link to="/login" className="text-sm text-[#C2C5CB] no-underline hover:text-paper">Open the app</Link>
                    <Link to="/login" className="text-sm text-[#C2C5CB] no-underline hover:text-paper">Sign in</Link>
                    <a href={GITHUB_URL} className="text-sm text-[#C2C5CB] no-underline hover:text-paper">GitHub</a>
                  </div>
                </div>
              </div>
              <div className="mt-9 flex flex-wrap justify-between gap-2.5 border-t border-paper/10 pt-[22px] font-mono text-[11.5px] tracking-[0.04em] text-[#6B6F76]">
                <span>© 2026 Workflow</span>
                <span>Submit · Review · Decide</span>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
