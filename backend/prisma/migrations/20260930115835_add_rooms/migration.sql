-- AlterTable
ALTER TABLE "ClassSchedule" ADD COLUMN     "room_id" TEXT;

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_org_id_idx" ON "Room"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Room_org_id_name_key" ON "Room"("org_id", "name");

-- CreateIndex
CREATE INDEX "ClassSchedule_room_id_idx" ON "ClassSchedule"("room_id");

-- CreateIndex
CREATE INDEX "ClassSchedule_class_id_idx" ON "ClassSchedule"("class_id");

-- CreateIndex
CREATE INDEX "ClassSchedule_org_id_class_id_idx" ON "ClassSchedule"("org_id", "class_id");

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
