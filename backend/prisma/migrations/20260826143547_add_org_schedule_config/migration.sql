-- CreateTable
CREATE TABLE "OrgScheduleConfig" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "start_time" TEXT NOT NULL DEFAULT '07:00',
    "end_time" TEXT NOT NULL DEFAULT '17:00',
    "slot_duration" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgScheduleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgScheduleConfig_org_id_key" ON "OrgScheduleConfig"("org_id");
