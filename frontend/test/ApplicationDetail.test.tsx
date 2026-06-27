import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApplicationDetail } from '../src/pages/ApplicationDetail.js';
import { renderAt } from './utils.js';
import type { ApplicationDetail as Detail, Role, User } from '../src/api/types.js';

const API = 'http://localhost:4000';

const reviewer: User = { id: 'r1', name: 'Rohan Reviewer', email: 'r@x', role: 'REVIEWER' };
const applicant: User = { id: 'a1', name: 'Aisha Applicant', email: 'a@x', role: 'APPLICANT' };

function detail(overrides: Partial<Detail>): Detail {
  return {
    id: 'app-1',
    title: 'New laptop',
    category: 'EQUIPMENT',
    description: 'A dev machine',
    amount: '1200.00',
    attachmentUrl: null,
    attachmentName: null,
    status: 'UNDER_REVIEW',
    ownerId: 'a1',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-21T10:00:00.000Z',
    availableTransitions: [],
    canEdit: false,
    auditTrail: [],
    ...overrides,
  };
}

let currentUser: User = reviewer;
let currentDetail: Detail = detail({});

const server = setupServer(
  http.get(`${API}/me`, () => HttpResponse.json({ user: currentUser })),
  http.get(`${API}/applications/:id`, () =>
    HttpResponse.json({ application: currentDetail }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setUser(role: Role) {
  currentUser = role === 'REVIEWER' ? reviewer : applicant;
}

describe('ApplicationDetail — role-gated actions', () => {
  it('shows reviewer actions from availableTransitions', async () => {
    setUser('REVIEWER');
    currentDetail = detail({
      status: 'UNDER_REVIEW',
      availableTransitions: ['approve', 'reject', 'return_for_changes'],
    });
    server.use(http.get(`${API}/me`, () => HttpResponse.json({ user: reviewer })));

    renderAt('/applications/app-1', '/applications/:id', <ApplicationDetail />);

    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return for changes' })).toBeInTheDocument();
  });

  it('hides Approve for an applicant viewing their own application', async () => {
    setUser('APPLICANT');
    // The server returns an empty availableTransitions for the applicant —
    // the UI must not invent an Approve button.
    currentDetail = detail({ status: 'UNDER_REVIEW', availableTransitions: [] });

    renderAt('/applications/app-1', '/applications/:id', <ApplicationDetail />);

    await screen.findByRole('heading', { name: 'New laptop' });
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
  });

  it('surfaces a clean error if a transition is forged and the API returns 403', async () => {
    setUser('REVIEWER');
    currentDetail = detail({ status: 'UNDER_REVIEW', availableTransitions: ['approve'] });
    server.use(
      http.post(`${API}/applications/:id/transition`, () =>
        HttpResponse.json(
          { error: { code: 'FORBIDDEN', message: 'You are not allowed to perform this action' } },
          { status: 403 },
        ),
      ),
    );

    renderAt('/applications/app-1', '/applications/:id', <ApplicationDetail />);
    const approve = await screen.findByRole('button', { name: 'Approve' });
    await userEvent.click(approve);

    expect(await screen.findByRole('alert')).toHaveTextContent(/not allowed/i);
  });
});
