-- Create ProgramCalendarHoliday table
CREATE TABLE "ProgramCalendarHoliday" (
    "id"          TEXT        NOT NULL,
    "org_id"      TEXT        NOT NULL,
    "calendar_id" TEXT        NOT NULL,
    "holiday_key" TEXT,
    "title"       TEXT        NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "type"        TEXT        NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCalendarHoliday_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProgramCalendarHoliday_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "ProgramCalendar"("id") ON DELETE CASCADE
);

-- Make OrgHolidayConfig org-global: drop school_year_id column
-- First drop the foreign key constraint if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrgHolidayConfig_school_year_id_fkey') THEN
    ALTER TABLE "OrgHolidayConfig" DROP CONSTRAINT "OrgHolidayConfig_school_year_id_fkey";
  END IF;
END $$;

-- Drop the old unique constraint on (org_id, school_year_id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrgHolidayConfig_org_id_school_year_id_key') THEN
    ALTER TABLE "OrgHolidayConfig" DROP CONSTRAINT "OrgHolidayConfig_org_id_school_year_id_key";
  END IF;
END $$;

-- Drop school_year_id column
ALTER TABLE "OrgHolidayConfig" DROP COLUMN "school_year_id";

-- Add unique constraint on org_id alone
ALTER TABLE "OrgHolidayConfig" ADD CONSTRAINT "OrgHolidayConfig_org_id_key" UNIQUE ("org_id");

-- Fix ProgramCalendar: drop program_id unique, add (program_id, school_year_id) unique
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProgramCalendar_program_id_key') THEN
    ALTER TABLE "ProgramCalendar" DROP CONSTRAINT "ProgramCalendar_program_id_key";
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProgramCalendar_program_id_school_year_id_key') THEN
    ALTER TABLE "ProgramCalendar" ADD CONSTRAINT "ProgramCalendar_program_id_school_year_id_key" UNIQUE ("program_id", "school_year_id");
  END IF;
END $$;
