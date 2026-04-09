/*
  Warnings:

  - You are about to drop the column `educator_id` on the `GradingScheme` table. All the data in the column will be lost.
  - You are about to drop the column `school_year_id` on the `GradingScheme` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email_extension]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Made the column `class_id` on table `GradingScheme` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email_extension` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GradingScheme" DROP CONSTRAINT "GradingScheme_class_id_fkey";

-- DropForeignKey
ALTER TABLE "GradingScheme" DROP CONSTRAINT "GradingScheme_school_year_id_fkey";

-- AlterTable
ALTER TABLE "GradingScheme" DROP COLUMN "educator_id",
DROP COLUMN "school_year_id",
ADD COLUMN     "template_id" TEXT,
ALTER COLUMN "class_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "email_extension" SET NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "personal_email" TEXT;

-- CreateTable
CREATE TABLE "GradingSchemeTemplate" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingSchemeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingSchemeTemplateComponent" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingSchemeTemplateComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_email_extension_key" ON "Organization"("email_extension");

-- AddForeignKey
ALTER TABLE "GradingSchemeTemplateComponent" ADD CONSTRAINT "GradingSchemeTemplateComponent_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "GradingSchemeTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScheme" ADD CONSTRAINT "GradingScheme_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
