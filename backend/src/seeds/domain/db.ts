/**
 * db.ts
 *
 * Shared PrismaClient singleton for the domain seed modules. Every seeder,
 * the readiness checker, and the schedule-conflict repairer import `db` from
 * here rather than instantiating their own client, so they all share one
 * connection pool and the entrypoint owns the single $disconnect() call.
 */

import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();
