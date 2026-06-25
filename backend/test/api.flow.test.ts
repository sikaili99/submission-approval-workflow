import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/http/app.js';
import { prisma } from '../src/lib/db.js';
import { bearer, resetDb, type SeededUsers } from './helpers.js';

vi.mock('../src/lib/cloudinary.js', () => ({
  isUploadEnabled: () => true,
  uploadAttachment: vi.fn(async (_buf: Buffer, name: string) => ({
    url: 'https://cdn.example/test.png',
    name,
  })),
}));

const app = createApp();
let users: SeededUsers;

beforeEach(async () => {
  users = await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function asApplicant() {
  return bearer(users.applicant.token);
}
function asReviewer() {
  return bearer(users.reviewer.token);
}

async function createDraft(body?: Record<string, unknown>): Promise<string> {
  const res = await request(app)
    .post('/applications')
    .set('Authorization', asApplicant())
    .send({ title: 'Lifecycle', category: 'GRANT', amount: 500, ...body });
  expect(res.status).toBe(201);
  return res.body.application.id as string;
}

function transition(id: string, token: string, action: string, comment?: string) {
  return request(app)
    .post(`/applications/${id}/transition`)
    .set('Authorization', bearer(token))
    .send({ action, ...(comment ? { comment } : {}) });
}

describe('happy-path lifecycle', () => {
  it('DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED with a full audit trail', async () => {
    const id = await createDraft();

    await transition(id, users.applicant.token, 'submit').expect(200);
    await transition(id, users.reviewer.token, 'start_review').expect(200);
    const approved = await transition(id, users.reviewer.token, 'approve');
    expect(approved.status).toBe(200);
    expect(approved.body.application.status).toBe('APPROVED');

    const trail = approved.body.application.auditTrail;
    expect(trail.map((e: { toStatus: string }) => e.toStatus)).toEqual([
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
    ]);
    expect(approved.body.application.availableTransitions).toEqual([]);
  });

  it('return_for_changes round-trip: UNDER_REVIEW -> DRAFT -> resubmit', async () => {
    const id = await createDraft();
    await transition(id, users.applicant.token, 'submit').expect(200);
    await transition(id, users.reviewer.token, 'start_review').expect(200);
    await transition(id, users.reviewer.token, 'return_for_changes', 'add detail').expect(200);

    const detail = await request(app)
      .get(`/applications/${id}`)
      .set('Authorization', asApplicant());
    expect(detail.body.application.status).toBe('DRAFT');
    expect(detail.body.application.canEdit).toBe(true);

    // Owner can edit again now that it is back in DRAFT.
    await request(app)
      .patch(`/applications/${id}`)
      .set('Authorization', asApplicant())
      .send({ description: 'more detail' })
      .expect(200);

    await transition(id, users.applicant.token, 'submit').expect(200);
  });
});

describe('illegal transitions and structured errors', () => {
  it('rejects an illegal transition with 409', async () => {
    const id = await createDraft();
    // approve directly from DRAFT is not a legal edge
    const res = await transition(id, users.reviewer.token, 'approve');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ILLEGAL_TRANSITION');
  });

  it('requires a comment to reject (422)', async () => {
    const id = await createDraft();
    await transition(id, users.applicant.token, 'submit').expect(200);
    await transition(id, users.reviewer.token, 'start_review').expect(200);
    const res = await transition(id, users.reviewer.token, 'reject');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('COMMENT_REQUIRED');
  });

  it('does not write an audit row when a transition fails', async () => {
    const id = await createDraft();
    await transition(id, users.reviewer.token, 'approve').expect(409); // illegal
    const count = await prisma.auditEntry.count({ where: { applicationId: id } });
    expect(count).toBe(0);
  });

  it('returns 404 for an unknown application', async () => {
    const res = await request(app)
      .get('/applications/00000000-0000-0000-0000-000000000000')
      .set('Authorization', asReviewer());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 422 with field details for an invalid create', async () => {
    const res = await request(app)
      .post('/applications')
      .set('Authorization', asApplicant())
      .send({ title: '', category: 'NOPE', amount: -5 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});

describe('reviewer queue filtering', () => {
  it('filters the queue by status and applicants see only their own', async () => {
    const a = await createDraft({ title: 'A' });
    const b = await createDraft({ title: 'B' });
    await transition(a, users.applicant.token, 'submit').expect(200);

    const submitted = await request(app)
      .get('/applications?status=SUBMITTED')
      .set('Authorization', asReviewer());
    expect(submitted.body.applications).toHaveLength(1);
    expect(submitted.body.applications[0].id).toBe(a);

    const drafts = await request(app)
      .get('/applications?status=DRAFT')
      .set('Authorization', asReviewer());
    expect(drafts.body.applications.map((x: { id: string }) => x.id)).toContain(b);

    // Another applicant sees none of the first applicant's work.
    const others = await request(app)
      .get('/applications')
      .set('Authorization', bearer(users.applicant2.token));
    expect(others.body.applications).toHaveLength(0);
  });
});

describe('attachment upload', () => {
  it('accepts a valid file on a DRAFT and stores the URL', async () => {
    const id = await createDraft();
    const res = await request(app)
      .post(`/applications/${id}/attachment`)
      .set('Authorization', asApplicant())
      .attach('file', Buffer.from('fake-png'), { filename: 'doc.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.application.attachmentUrl).toBe('https://cdn.example/test.png');
    expect(res.body.application.attachmentName).toBe('doc.png');
  });

  it('rejects an unsupported file type (422)', async () => {
    const id = await createDraft();
    const res = await request(app)
      .post(`/applications/${id}/attachment`)
      .set('Authorization', asApplicant())
      .attach('file', Buffer.from('x'), { filename: 'bad.exe', contentType: 'application/x-msdownload' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an attachment once the application has left DRAFT (409)', async () => {
    const id = await createDraft();
    await transition(id, users.applicant.token, 'submit').expect(200);
    const res = await request(app)
      .post(`/applications/${id}/attachment`)
      .set('Authorization', asApplicant())
      .attach('file', Buffer.from('x'), { filename: 'doc.png', contentType: 'image/png' });
    expect(res.status).toBe(409);
  });
});
