-- AlterTable
ALTER TABLE "GroupyMessage" ADD COLUMN "sender_profile_image" TEXT;

-- Backfill sender_profile_image for existing rows from the sender's Profile.
UPDATE "GroupyMessage" gm
SET "sender_profile_image" = p."profile_image"
FROM "Profile" p
WHERE p."account_id" = gm."sender_account_id";

-- CreateTable
CREATE TABLE "GroupyReadReceipt" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "last_read_message_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupyReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupyReadReceipt_class_id_account_id_key" ON "GroupyReadReceipt"("class_id", "account_id");

-- CreateIndex
CREATE INDEX "GroupyReadReceipt_org_id_class_id_idx" ON "GroupyReadReceipt"("org_id", "class_id");