import { execSync } from 'node:child_process';

// Runs once before the suite. Applies migrations to the test database so the
// schema is current. The test DATABASE_URL is provided via .env.test (loaded
// by the test script) and falls back to a local default.
export default function setup(): void {
  const url =
    process.env.DATABASE_URL ??
    'postgresql://app:app@localhost:5432/approvals_test?schema=public';

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
