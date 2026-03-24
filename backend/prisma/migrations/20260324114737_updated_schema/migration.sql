/*
  Warnings:

  - You are about to drop the column `created_at` on the `Organization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[admin_account_id]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "created_at",
ADD COLUMN     "admin_account_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_admin_account_id_key" ON "Organization"("admin_account_id");

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
