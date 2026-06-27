# Submission & Approval Workflow

A small, two-sided web app built around a **correctly enforced status workflow with an immutable audit trail**. Applicants submit applications and track their status; reviewers triage a queue and approve, reject, or return them with comments. Every status change is recorded — who, old → new, comment, when — and shown on the application’s detail page.

This is my submission for the Full‑Stack Developer technical assessment (**Assignment B**).

- **Backend:** Node.js + TypeScript, Express, Prisma, PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Tests:** 74 total — 65 backend (Vitest + supertest), 9 frontend (Vitest + Testing Library + MSW)

> **Live demo:** http://84.247.140.73:5000 — log in with the seeded users below.

---

## Quick start (Docker — one command)

Requires Docker. Brings up **database + backend + frontend** together:

```bash
cp .env.example .env        # optional; sensible defaults work as‑is
docker compose up --build
```

Then open:

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:8080   |
| Backend  | http://localhost:4000   |

The backend waits for Postgres to be healthy, then applies migrations, seeds the demo users, and starts. No second step needed — the app is populated and login‑ready.

### Seeded logins

| Role      | Token (paste on the login screen) |
|-----------|-----------------------------------|
| Applicant | `demo-applicant-token`            |
| Reviewer  | `demo-reviewer-token`             |

The login screen also has **Continue as Applicant / Continue as Reviewer** buttons that use these tokens directly.

> The assessment asks specifically for a `docker-compose.yml` that brings up the **database and backend**. That works on its own — `docker compose up db backend` — with the frontend run separately (see below). The compose file also includes the frontend as a convenience so the whole app comes up at once.

---

## Running locally without Docker (development)

**Prerequisites:** Node 20+, a running PostgreSQL.

**Backend**

```bash
cd backend
cp ../.env.example .env      # then set DATABASE_URL to your local Postgres
# e.g. DATABASE_URL=postgresql://app:app@localhost:5432/approvals?schema=public
npm install
npx prisma migrate deploy    # create the schema
npx prisma db seed           # create the two demo users
npm run dev                  # http://localhost:4000
```

**Frontend** (separate terminal)

```bash
cd frontend
cp .env.example .env          # VITE_API_URL defaults to http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

---

## Tests

```bash
# Backend — state machine + API (needs a Postgres test DB; see backend/.env.test)
cd backend && npm test

# Frontend — components + hooks (no services needed)
cd frontend && npm test
```

What the tests cover (the parts that matter for this exercise):

- **State machine, exhaustively** — every legal edge, the **full 25‑pair status × action matrix** (everything not legal throws an illegal‑transition error), the comment‑required rules, and the named case *an applicant cannot approve their own application*.
- **Authorization over HTTP, not assumed** — an applicant calling the approve/reject/return endpoint on their own application gets **403**; an applicant editing after DRAFT gets **409**; a reviewer creating an application gets **403**; cross‑applicant access gets **403**.
- **Structured errors** — illegal transition → **409**, validation / comment‑required → **422** (with field details), not found → **404**, missing/invalid token → **401**.
- **Audit integrity** — a transition and its audit row are written in one transaction; no audit row is written when a transition fails.
- **Frontend** — reviewer actions render from `availableTransitions`, **Approve is hidden for an applicant**, a forged transition that returns 403 surfaces a clean inline error, and the required‑comment dialog is disabled until non‑empty and traps/restores focus.

---

## The workflow (the core of the exercise)

```
DRAFT --submit--> SUBMITTED --start_review--> UNDER_REVIEW --approve--> APPROVED
                                                          --reject---> REJECTED
SUBMITTED      --return_for_changes--> DRAFT
UNDER_REVIEW   --return_for_changes--> DRAFT
```

| From         | Action               | To           | Who                 | Comment required |
|--------------|----------------------|--------------|---------------------|:----------------:|
| DRAFT        | submit               | SUBMITTED    | owner (applicant)   | no               |
| SUBMITTED    | start_review         | UNDER_REVIEW | reviewer            | no               |
| UNDER_REVIEW | approve              | APPROVED     | reviewer            | no               |
| UNDER_REVIEW | reject               | REJECTED     | reviewer            | **yes**          |
| SUBMITTED    | return_for_changes   | DRAFT        | reviewer            | **yes**          |
| UNDER_REVIEW | return_for_changes   | DRAFT        | reviewer            | **yes**          |

Anything not in this table is an illegal transition (409). `APPROVED` and `REJECTED` are terminal. Editing is **not** a transition — it’s a field mutation allowed only while the owner’s application is a DRAFT (`canEdit`).

The single most important design choice: this table lives in **one pure, dependency‑free module** (`backend/src/domain/workflow.ts`). The same function that decides whether a transition is allowed also computes `availableTransitions` for the detail response — so the **frontend renders action buttons from exactly what the server will allow**, and the server enforces it independently. The client is never the authority.

---

## Data model

Three tables (Prisma + PostgreSQL). Status, role, and category are Postgres enums.

- **User** — `id`, `name`, `email` (unique), `role` (`APPLICANT | REVIEWER`), `token` (unique, opaque bearer token). Seeded.
- **Application** — `id`, `ownerId → User`, `title`, `category`, `description`, `amount` (nullable, ≥ 0), `attachmentUrl` / `attachmentName` (nullable), `status` (default `DRAFT`), `createdAt`, `updatedAt`. Indexed on `status` (reviewer queue) and `ownerId`.
- **AuditEntry** — `id`, `applicationId → Application`, `actorId → User`, `action`, `fromStatus`, `toStatus`, `comment` (nullable), `createdAt`. **Append‑only**: rows are only ever inserted; the API exposes no update or delete path. Indexed on `(applicationId, createdAt)` for the timeline.

Schema and migrations live in `backend/prisma/`. The seed (`prisma/seed.ts`) is idempotent (`upsert` on email).

---

## API

All requests send `Authorization: Bearer <token>`. Errors use one envelope: `{ "error": { "code", "message", "details?" } }`.

| Method | Path                              | Role                | Notes |
|--------|-----------------------------------|---------------------|-------|
| GET    | `/healthz`                        | —                   | liveness; pings the DB |
| GET    | `/me`                             | any auth            | resolves token → user |
| GET    | `/applications`                   | applicant / reviewer| applicant: own list; reviewer: full queue. `?status=` filters |
| POST   | `/applications`                   | applicant           | create a DRAFT (validated) → 201 |
| GET    | `/applications/:id`               | owner or reviewer   | detail + `auditTrail` + `availableTransitions` + `canEdit` |
| PATCH  | `/applications/:id`               | owner, DRAFT only   | edit fields; 403/409 otherwise |
| POST   | `/applications/:id/attachment`    | owner, DRAFT only   | multipart `file` → Cloudinary; size/type capped |
| POST   | `/applications/:id/transition`    | role per transition | `{ action, comment? }`; atomic status + audit write |

### Authorization model

- A bearer token resolves to a seeded user; that user’s **role is what every check trusts**. (Intentionally not production auth — no passwords/JWT — but the role checks are real and enforced **server‑side on every mutation**.)
- For every mutation the server **re‑derives ownership from the database** (`isOwner = app.ownerId === actor.id`) and hands it to the pure state machine, which enforces both the legal‑transition rule and the role/ownership rule. So authorization is enforced at the domain layer, not bolted onto handlers — *an applicant cannot approve their own application even by calling the API directly* (there’s a test for exactly this).

Drive the whole thing from the command line:

```bash
A='Authorization: Bearer demo-applicant-token'
R='Authorization: Bearer demo-reviewer-token'
B=http://localhost:4000

ID=$(curl -s -H "$A" -H 'Content-Type: application/json' \
  -d '{"title":"New laptop","category":"EQUIPMENT","amount":1200}' \
  "$B/applications" | python3 -c 'import sys,json;print(json.load(sys.stdin)["application"]["id"])')

curl -s -H "$A" -H 'Content-Type: application/json' -d '{"action":"submit"}'        "$B/applications/$ID/transition"
curl -s -H "$R" -H 'Content-Type: application/json' -d '{"action":"start_review"}'  "$B/applications/$ID/transition"
# applicant approving their own app → 403
curl -s -o /dev/null -w '%{http_code}\n' -H "$A" -H 'Content-Type: application/json' -d '{"action":"approve"}' "$B/applications/$ID/transition"
curl -s -H "$R" -H 'Content-Type: application/json' -d '{"action":"approve"}'       "$B/applications/$ID/transition"
```

---

## Frontend

- **Applicant:** a “my applications” list (status badges), a create/edit draft form with validation and an optional file attachment, and submit.
- **Reviewer:** a status‑filterable queue and a detail view with approve / reject / return actions (reject and return open a required‑comment dialog).
- **Shared detail page:** status, metadata, attachment, the action bar (rendered from `availableTransitions`), a returned‑for‑changes callout, and the **audit timeline**.
- Every data view handles **loading / error / empty** consistently (an `AsyncBoundary` wrapper).
- **Accessibility:** labelled inputs with `aria-invalid` / `aria-describedby`, `role="alert"` errors, and a comment dialog that is a proper `role="dialog"` `aria-modal` — focus moves in on open, is trapped, returns to the trigger on close, and `Esc` closes it.

---

## Design decisions & trade‑offs

- **A pure state‑machine module is the heart of the system.** Keeping the transition table as plain data (no I/O) makes it trivially and exhaustively testable, makes the policy readable at a glance, and lets the same logic drive both enforcement and the UI’s `availableTransitions`. This is what guarantees the workflow is correct.
- **Atomic transition + audit, append‑only log.** The status update and its audit row are written in one Prisma transaction, so state and trail can never diverge; the audit table has no update/delete code path, so the history is tamper‑evident.
- **The “returned for changes” round‑trip reuses the audit log.** The visible revision history is produced by grouping the immutable audit trail into revision cycles in the UI (a new revision begins each return to DRAFT) — no separate snapshot table, one source of truth.
- **Auth is deliberately minimal but real.** Seeded users with opaque bearer tokens — no passwords/JWT — because the brief explicitly doesn’t need production auth, but the role/ownership checks are real and server‑side. Swapping in real auth later only changes how a request resolves to a `{ userId, role }`.
- **Prisma + plain queries over heavier tooling.** Prisma gives typed access and first‑class migrations with little ceremony for a schema this size.
- **Hand‑written CORS middleware** instead of a dependency — it’s a few lines and avoids adding a package for one small need.

### What I’d add with more time

- Real authentication (passwords/OAuth, sessions/refresh) and richer RBAC.
- Optimistic concurrency (a `version` column / row locking) so two reviewers can’t race the same application.
- Reviewer queue pagination + search; notifications on status change.
- Attachment virus scanning and signed download URLs; multiple attachments.
- E2E tests (Playwright) and a CI workflow running both test suites.

---

## Deployment

The app is fully containerised, so it deploys anywhere that can run the `backend` and `frontend` images plus a Postgres database (a single VM with `docker compose`, or a platform like Render / Railway / Fly) but for this deployment I used a VPS.

- **Backend** image runs migrations + seed on start. Set `DATABASE_URL`, `CORS_ORIGIN` (the deployed frontend URL), and the `CLOUDINARY_*` vars (for attachments).
- **Frontend** image is built with `VITE_API_URL` pointing at the deployed backend, then served by nginx.
- File attachments use **Cloudinary** (free tier). Without the `CLOUDINARY_*` vars, the rest of the app works and the attachment endpoint returns a clear “uploads not configured” error.

---

## Use of AI tools

Per the assessment’s transparency request:

- **Tools used:** Claude (Anthropic) — both Claude Code (the CLI agent, for scaffolding, implementation, and tests) and Claude’s design feature (to generate the UI prototype the React frontend is based on).
- **How I used them:**
  - *Design:* I wrote a UI brief, generated a visual prototype with Claude’s design tool, then translated that prototype into the real React components and wired them to the actual API contract.
  - *Backend & tests:* Claude Code helped scaffold the project, draft the state machine and API, and write the test suites; I directed the architecture (pure state machine, server‑computed `availableTransitions`, append‑only audit, the error‑code mapping) and the scope decisions.
  - *Docs:* assisted with drafting this README.
- **What I verified myself:** I ran and confirmed every test (74 passing), drove the full workflow via curl, and verified the entire stack end‑to‑end with `docker compose up` (DB healthy → migrations → seed → login → the workflow, including that an applicant approving their own application returns 403). I understand and can explain every part of the codebase, including anything AI‑generated.
