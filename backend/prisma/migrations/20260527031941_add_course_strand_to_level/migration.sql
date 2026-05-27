/*
  Warnings:

  - You are about to drop the `Guide` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GuideStep` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- DropForeignKey
ALTER TABLE "GuideStep" DROP CONSTRAINT "GuideStep_guide_id_fkey";

-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "strand_id" TEXT;

-- DropTable
DROP TABLE "Guide";

-- DropTable
DROP TABLE "GuideStep";

-- DropEnum
DROP TYPE "GuidePortal";

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "code" TEXT NOT NULL,
    "plan" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "plan" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
