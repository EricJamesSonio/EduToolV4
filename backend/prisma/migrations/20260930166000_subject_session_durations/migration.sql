-- Per-session weekly session lengths (TICK-SUBJECT-003).
--
-- `session_durations[i]` is the length of the subject's i-th weekly session,
-- so [60, 60, 120] means "two 60m sessions and one 2h session".
--
-- EMPTY means "uniform": every session uses the existing `session_minutes`
-- column. Every row written before this migration has an empty array, so
-- `[]` is exactly today's behaviour and no backfill is required or wanted.
--
-- NOT NULL DEFAULT '{}' is deliberate over a nullable array: it keeps "unset"
-- and "set to nothing" the same idea, and makes the no-backfill property
-- obvious from the schema alone. The service, not the database, enforces that
-- a non-empty array's length equals `sessions_per_week`.
ALTER TABLE "Subject"
    ADD COLUMN "session_durations" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
