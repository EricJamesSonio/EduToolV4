-- CreateTable
CREATE TABLE "ProgramCalendar" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCalendarBreak" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCalendarBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCalendarTerm" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCalendarTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgHolidayConfig" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "enabled_keys" TEXT[],
    "custom_holidays" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgHolidayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCalendar_program_id_key" ON "ProgramCalendar"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrgHolidayConfig_org_id_school_year_id_key" ON "OrgHolidayConfig"("org_id", "school_year_id");

-- AddForeignKey
ALTER TABLE "AcademicCalendar" ADD CONSTRAINT "AcademicCalendar_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCalendar" ADD CONSTRAINT "ProgramCalendar_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCalendar" ADD CONSTRAINT "ProgramCalendar_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCalendarBreak" ADD CONSTRAINT "ProgramCalendarBreak_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "ProgramCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCalendarTerm" ADD CONSTRAINT "ProgramCalendarTerm_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "ProgramCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgHolidayConfig" ADD CONSTRAINT "OrgHolidayConfig_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
