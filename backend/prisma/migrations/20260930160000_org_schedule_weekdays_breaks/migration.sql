-- Phase 1 (auto-class): org active weekdays + org-wide breaks.
--
-- active_weekdays defaults to ALL seven (0 = Sunday .. 6 = Saturday). That
-- makes the default a superset of every weekday any existing schedule can
-- already use, so this migration cannot invalidate existing data and needs no
-- backfill. An admin narrows the set to the real school week afterwards.
--
-- breaks is org-wide in v1; per-day breaks are out of scope.
ALTER TABLE "OrgScheduleConfig"
    ADD COLUMN "active_weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
    ADD COLUMN "breaks" JSONB NOT NULL DEFAULT '[]';
