-- Phase 4 (auto-class): educator availability and load limits.
--
-- One row per educator (educator_id is @unique), created lazily.
-- available_weekdays is stored raw and INTERSECTED with the org's active
-- weekdays at read time, so narrowing the school week later never requires a
-- data migration across every educator row.
--
-- ON DELETE CASCADE: removing an educator removes their availability profile.
CREATE TABLE "EducatorScheduleProfile" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "educator_id" TEXT NOT NULL,
    "use_custom_availability" BOOLEAN NOT NULL DEFAULT false,
    "available_weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "max_minutes_per_day" INTEGER,
    "max_minutes_per_week" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducatorScheduleProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducatorScheduleProfile_educator_id_key" ON "EducatorScheduleProfile"("educator_id");
CREATE INDEX "EducatorScheduleProfile_org_id_idx" ON "EducatorScheduleProfile"("org_id");

ALTER TABLE "EducatorScheduleProfile" ADD CONSTRAINT "EducatorScheduleProfile_educator_id_fkey"
  FOREIGN KEY ("educator_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
