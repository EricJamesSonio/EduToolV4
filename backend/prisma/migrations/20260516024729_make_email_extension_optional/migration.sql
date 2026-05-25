-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "email_extension" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_educator_id_fkey" FOREIGN KEY ("educator_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
