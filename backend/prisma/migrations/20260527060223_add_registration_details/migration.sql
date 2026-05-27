-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "institution_name" TEXT,
ADD COLUMN     "programs_departments" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "student_count" TEXT;

-- AlterTable
ALTER TABLE "RegistrationRequest" ADD COLUMN     "institution_name" TEXT,
ADD COLUMN     "programs_departments" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "student_count" TEXT;
