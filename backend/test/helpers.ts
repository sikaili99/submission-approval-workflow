import { prisma } from '../src/lib/db.js';
import { Role } from '../src/generated/prisma/index.js';

export const APPLICANT_TOKEN = 'test-applicant-token';
export const APPLICANT2_TOKEN = 'test-applicant2-token';
export const REVIEWER_TOKEN = 'test-reviewer-token';

export interface SeededUsers {
  applicant: { id: string; token: string };
  applicant2: { id: string; token: string };
  reviewer: { id: string; token: string };
}

export async function resetDb(): Promise<SeededUsers> {
  // Order matters: children before parents (FKs).
  await prisma.auditEntry.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();

  const applicant = await prisma.user.create({
    data: {
      name: 'Test Applicant',
      email: 'applicant@test.local',
      role: Role.APPLICANT,
      token: APPLICANT_TOKEN,
    },
  });
  const applicant2 = await prisma.user.create({
    data: {
      name: 'Other Applicant',
      email: 'applicant2@test.local',
      role: Role.APPLICANT,
      token: APPLICANT2_TOKEN,
    },
  });
  const reviewer = await prisma.user.create({
    data: {
      name: 'Test Reviewer',
      email: 'reviewer@test.local',
      role: Role.REVIEWER,
      token: REVIEWER_TOKEN,
    },
  });

  return {
    applicant: { id: applicant.id, token: applicant.token },
    applicant2: { id: applicant2.id, token: applicant2.token },
    reviewer: { id: reviewer.id, token: reviewer.token },
  };
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
