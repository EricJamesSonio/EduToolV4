/**
 * seed-domain-data.ts
 *
 * Standalone seed script that populates domain data (programs, levels,
 * subjects, educators, students, classes, etc.) for the 8 pre-seeded
 * admin/school organizations created by start.ts.
 *
 * Usage:  npx ts-node src/seeds/seed-domain-data.ts
 *
 * This script is IDEMPOTENT — re-running it will skip already-seeded records.
 *
 * All actual seeding logic now lives under ./domain — see
 * ./domain/orchestrator.ts for the top-level flow and ./domain/README.md
 * (if present) for the module map. This file is intentionally just wiring:
 * install the reflect-metadata polyfill, run the orchestrator, and manage
 * the Prisma connection lifecycle.
 */

// MUST be the very first import — class-validator/class-transformer decorators
// (used transitively via org-seeder data/services) call Reflect.getMetadata at
// module-load time. This is a standalone entry point (not routed through
// main.ts), so the polyfill has to be installed here before anything else runs.
import 'reflect-metadata';

import { db } from './domain/db';
import { run } from './domain/orchestrator';

run()
  .catch((e) => {
    console.error('❌ Seed domain data failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
