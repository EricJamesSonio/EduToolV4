-- Phase 3 (auto-class): which subjects an educator can teach, declared before
-- any class exists.
--
-- org_id is denormalised alongside the two foreign keys purely for query
-- scoping: every read filters by it, matching every other table in this schema.
-- educator_id is globally unique (Account.id), so the unique constraint below
-- cannot span two orgs.
--
-- ON DELETE CASCADE on educator: removing an account removes its teachable
-- links. ON DELETE RESTRICT on subject: Subject has no soft delete, so deleting
-- a subject that is still taught must fail loudly rather than silently orphan
-- the educator's profile.
CREATE TABLE "EducatorSubject" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "educator_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducatorSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducatorSubject_educator_id_subject_id_key" ON "EducatorSubject"("educator_id", "subject_id");
CREATE INDEX "EducatorSubject_org_id_subject_id_idx" ON "EducatorSubject"("org_id", "subject_id");
CREATE INDEX "EducatorSubject_org_id_educator_id_idx" ON "EducatorSubject"("org_id", "educator_id");

ALTER TABLE "EducatorSubject" ADD CONSTRAINT "EducatorSubject_educator_id_fkey"
  FOREIGN KEY ("educator_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EducatorSubject" ADD CONSTRAINT "EducatorSubject_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
