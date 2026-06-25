import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/http/app.js';
import { prisma } from '../src/lib/db.js';
import { bearer, resetDb, type SeededUsers } from './helpers.js';

const app = createApp();
let users: SeededUsers;

beforeEach(async () => {
  users = await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createDraft(token: string): Promise<string> {
  const res = await request(app)
    .post('/applications')
    .set('Authorization', bearer(token))
    .send({ title: 'Auth case', category: 'OTHER' });
  return res.body.application.id as string;
}

function drive(id: string, token: string, action: string, comment?: string) {
  return request(app)
    .post(`/applications/${id}/transition`)
    .set('Authorization', bearer(token))
    .send({ action, ...(comment ? { comment } : {}) });
}

describe('authentication', () => {
  it('rejects requests with no token (401)', async () => {
    await request(app).get('/applications').expect(401);
  });

  it('rejects an unknown token (401)', async () => {
    await request(app)
      .get('/applications')
      .set('Authorization', bearer('not-a-real-token'))
      .expect(401);
  });
});

describe('authorization — the core invariant', () => {
  it('an applicant cannot approve their own application via direct API (403)', async () => {
    const id = await createDraft(users.applicant.token);
    await drive(id, users.applicant.token, 'submit').expect(200);
    await drive(id, users.reviewer.token, 'start_review').expect(200);

    const res = await drive(id, users.applicant.token, 'approve');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    // The state must be unchanged after a forbidden attempt.
    const detail = await request(app)
      .get(`/applications/${id}`)
      .set('Authorization', bearer(users.reviewer.token));
    expect(detail.body.application.status).toBe('UNDER_REVIEW');
  });

  it('an applicant cannot reject or return their own application (403)', async () => {
    const id = await createDraft(users.applicant.token);
    await drive(id, users.applicant.token, 'submit').expect(200);
    await drive(id, users.reviewer.token, 'start_review').expect(200);

    await drive(id, users.applicant.token, 'reject', 'no').expect(403);
    await drive(id, users.applicant.token, 'return_for_changes', 'redo').expect(403);
  });

  it('an applicant cannot start review (403)', async () => {
    const id = await createDraft(users.applicant.token);
    await drive(id, users.applicant.token, 'submit').expect(200);
    await drive(id, users.applicant.token, 'start_review').expect(403);
  });

  it('a different applicant cannot act on or read someone else’s application (403)', async () => {
    const id = await createDraft(users.applicant.token);

    await request(app)
      .get(`/applications/${id}`)
      .set('Authorization', bearer(users.applicant2.token))
      .expect(403);

    await drive(id, users.applicant2.token, 'submit').expect(403);
  });

  it('a reviewer cannot create an application (403)', async () => {
    await request(app)
      .post('/applications')
      .set('Authorization', bearer(users.reviewer.token))
      .send({ title: 'x', category: 'OTHER' })
      .expect(403);
  });

  it('an applicant cannot edit an application once it has left DRAFT (409)', async () => {
    const id = await createDraft(users.applicant.token);
    await drive(id, users.applicant.token, 'submit').expect(200);

    const res = await request(app)
      .patch(`/applications/${id}`)
      .set('Authorization', bearer(users.applicant.token))
      .send({ title: 'sneaky edit' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ILLEGAL_TRANSITION');
  });

  it('a reviewer cannot edit an applicant’s draft (403)', async () => {
    const id = await createDraft(users.applicant.token);
    await request(app)
      .patch(`/applications/${id}`)
      .set('Authorization', bearer(users.reviewer.token))
      .send({ title: 'reviewer edit' })
      .expect(403);
  });
});
