import { PrismaClient, Role } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

// Fixed demo tokens so the README can document logins and the hosted demo
// works without a setup step. These are seed/demo credentials only.
const SEED_USERS = [
  {
    name: 'Aisha Applicant',
    email: 'applicant@demo.openownership.test',
    role: Role.APPLICANT,
    token: 'demo-applicant-token',
  },
  {
    name: 'Rohan Reviewer',
    email: 'reviewer@demo.openownership.test',
    role: Role.REVIEWER,
    token: 'demo-reviewer-token',
  },
];

async function main() {
  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, token: u.token },
      create: u,
    });
  }

  const users = await prisma.user.findMany({ orderBy: { role: 'asc' } });
  console.log('Seeded users:');
  for (const u of users) {
    console.log(`  ${u.role.padEnd(10)} ${u.email}  token=${u.token}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
