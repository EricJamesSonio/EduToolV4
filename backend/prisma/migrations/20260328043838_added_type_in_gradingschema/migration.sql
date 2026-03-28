/*
  Warnings:

  - Added the required column `type` to the `GradingSchemeComponent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GradingSchemeComponent" ADD COLUMN     "type" TEXT NOT NULL;
