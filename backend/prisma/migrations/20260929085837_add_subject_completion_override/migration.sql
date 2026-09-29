-- CreateTable
CREATE TABLE "SubjectCompletionOverride" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectCompletionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubjectCompletionOverride_org_id_student_id_idx" ON "SubjectCompletionOverride"("org_id", "student_id");

-- CreateIndex
CREATE INDEX "SubjectCompletionOverride_org_id_subject_id_idx" ON "SubjectCompletionOverride"("org_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectCompletionOverride_org_id_student_id_subject_id_key" ON "SubjectCompletionOverride"("org_id", "student_id", "subject_id");

-- AddForeignKey
ALTER TABLE "SubjectCompletionOverride" ADD CONSTRAINT "SubjectCompletionOverride_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
