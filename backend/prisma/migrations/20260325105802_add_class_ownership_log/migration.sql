-- CreateTable
CREATE TABLE "ClassOwnershipLog" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "from_educator_id" TEXT NOT NULL,
    "to_educator_id" TEXT NOT NULL,
    "reason" TEXT,
    "reassigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reassigned_by" TEXT NOT NULL,

    CONSTRAINT "ClassOwnershipLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClassOwnershipLog" ADD CONSTRAINT "ClassOwnershipLog_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
