-- AlterTable
-- A nullable unique index: multiple NULLs allowed, duplicate non-null values blocked.
CREATE UNIQUE INDEX "Profile_personal_email_key" ON "Profile"("personal_email");