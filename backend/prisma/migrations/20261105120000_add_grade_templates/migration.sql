-- CreateTable
CREATE TABLE "GradeTemplate" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "program_id" TEXT,
    "name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_data" BYTEA NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeTemplateSubmission" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "educator_id" TEXT NOT NULL,
    "rows_written" INTEGER NOT NULL DEFAULT 0,
    "ungraded_count" INTEGER NOT NULL DEFAULT 0,
    "unmatched_count" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeTemplateSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeTemplate_org_id_school_year_id_idx" ON "GradeTemplate"("org_id", "school_year_id");

-- CreateIndex
CREATE INDEX "GradeTemplateSubmission_org_id_educator_id_idx" ON "GradeTemplateSubmission"("org_id", "educator_id");

-- CreateIndex
CREATE UNIQUE INDEX "GradeTemplateSubmission_template_id_class_id_key" ON "GradeTemplateSubmission"("template_id", "class_id");

-- AddForeignKey
ALTER TABLE "GradeTemplateSubmission" ADD CONSTRAINT "GradeTemplateSubmission_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "GradeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;