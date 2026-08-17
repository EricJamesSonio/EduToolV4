-- CreateTable
CREATE TABLE "AssessmentGradingOverride" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "include" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentGradingOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentGradingOverride_assessment_id_student_id_key" ON "AssessmentGradingOverride"("assessment_id", "student_id");

-- AddForeignKey
ALTER TABLE "AssessmentGradingOverride" ADD CONSTRAINT "AssessmentGradingOverride_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
