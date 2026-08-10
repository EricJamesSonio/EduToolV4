-- CreateEnum
CREATE TYPE "ConcernStatus" AS ENUM ('open', 'resolved');

-- CreateTable
CREATE TABLE "ConcernCategory" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConcernCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concern" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sender_account_id" TEXT NOT NULL,
    "sender_role" "Role" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "ConcernStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "Concern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConcernMessage" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "concern_id" TEXT NOT NULL,
    "sender_account_id" TEXT NOT NULL,
    "sender_role" "Role" NOT NULL,
    "sender_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConcernMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgConcernSetting" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "last_digest_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgConcernSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConcernCategory_org_id_label_key" ON "ConcernCategory"("org_id", "label");

-- CreateIndex
CREATE INDEX "Concern_org_id_sender_account_id_idx" ON "Concern"("org_id", "sender_account_id");

-- CreateIndex
CREATE INDEX "ConcernMessage_concern_id_idx" ON "ConcernMessage"("concern_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrgConcernSetting_org_id_key" ON "OrgConcernSetting"("org_id");

-- AddForeignKey
ALTER TABLE "Concern" ADD CONSTRAINT "Concern_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ConcernCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcernMessage" ADD CONSTRAINT "ConcernMessage_concern_id_fkey" FOREIGN KEY ("concern_id") REFERENCES "Concern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
