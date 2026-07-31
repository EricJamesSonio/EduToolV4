-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "log_type" TEXT NOT NULL DEFAULT 'admin';
