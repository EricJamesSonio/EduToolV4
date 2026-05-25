-- DropForeignKey
ALTER TABLE "ProgramCalendarHoliday" DROP CONSTRAINT "ProgramCalendarHoliday_calendar_id_fkey";

-- DropIndex
DROP INDEX "ProgramCalendar_program_id_key";

-- AlterTable
ALTER TABLE "Guide" ALTER COLUMN "is_active" SET DEFAULT true;

-- AlterTable
ALTER TABLE "LessonConcept" ADD COLUMN     "prompt_version" TEXT,
ADD COLUMN     "raw_request" TEXT,
ADD COLUMN     "raw_response" TEXT;

-- AddForeignKey
ALTER TABLE "ProgramCalendarHoliday" ADD CONSTRAINT "ProgramCalendarHoliday_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "ProgramCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
