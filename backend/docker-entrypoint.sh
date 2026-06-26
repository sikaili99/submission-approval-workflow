#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding database (idempotent)..."
npx prisma db seed

echo "Starting API server..."
exec npx tsx src/http/server.ts
