-- CreateTable
CREATE TABLE "GradingSchemeProgramAssignment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingSchemeProgramAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingSchemeProgramAssignment_org_id_idx" ON "GradingSchemeProgramAssignment"("org_id");

-- CreateIndex
CREATE INDEX "GradingSchemeProgramAssignment_template_id_idx" ON "GradingSchemeProgramAssignment"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "GradingSchemeProgramAssignment_program_id_school_year_id_key" ON "GradingSchemeProgramAssignment"("program_id", "school_year_id");

-- AddForeignKey
ALTER TABLE "GradingSchemeProgramAssignment" ADD CONSTRAINT "GradingSchemeProgramAssignment_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingSchemeProgramAssignment" ADD CONSTRAINT "GradingSchemeProgramAssignment_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingSchemeProgramAssignment" ADD CONSTRAINT "GradingSchemeProgramAssignment_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "GradingSchemeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
