/*
  Warnings:

  - You are about to drop the column `school_year_id` on the `GradeLockSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[org_id,name]` on the table `GradeLockSetting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `setting_id` to the `GradeLock` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GradeLockSetting_org_id_school_year_id_key";

-- AlterTable
ALTER TABLE "GradeLock" ADD COLUMN     "setting_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GradeLockSetting" DROP COLUMN "school_year_id",
ADD COLUMN     "allowOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deadlineDays" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockType" TEXT,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Default Setting',
ALTER COLUMN "lock_deadline" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GradeLockEvent" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "actor_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeLockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GradeLockSetting_org_id_name_key" ON "GradeLockSetting"("org_id", "name");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeLock" ADD CONSTRAINT "GradeLock_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "GradeLockSetting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeLockEvent" ADD CONSTRAINT "GradeLockEvent_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
