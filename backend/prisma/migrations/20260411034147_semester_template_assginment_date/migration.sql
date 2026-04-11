-- CreateTable
CREATE TABLE "ProgramSemesterTermDate" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramSemesterTermDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSemesterTermDate_assignment_id_term_id_key" ON "ProgramSemesterTermDate"("assignment_id", "term_id");

-- AddForeignKey
ALTER TABLE "ProgramSemesterTermDate" ADD CONSTRAINT "ProgramSemesterTermDate_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "ProgramSemesterAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSemesterTermDate" ADD CONSTRAINT "ProgramSemesterTermDate_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "SemesterTemplateTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
