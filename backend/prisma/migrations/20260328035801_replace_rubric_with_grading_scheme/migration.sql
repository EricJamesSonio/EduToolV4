/*
  Warnings:

  - You are about to drop the `Rubric` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Rubric";

-- CreateTable
CREATE TABLE "GradingScheme" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "educator_id" TEXT,
    "class_id" TEXT,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingSchemeComponent" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "grading_scheme_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingSchemeComponent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GradingScheme" ADD CONSTRAINT "GradingScheme_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingSchemeComponent" ADD CONSTRAINT "GradingSchemeComponent_grading_scheme_id_fkey" FOREIGN KEY ("grading_scheme_id") REFERENCES "GradingScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
