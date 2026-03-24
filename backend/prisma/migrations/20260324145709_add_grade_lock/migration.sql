-- CreateTable
CREATE TABLE "GradeLock" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeLockSetting" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "lock_deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeLockSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GradeLock_class_id_key" ON "GradeLock"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "GradeLockSetting_org_id_school_year_id_key" ON "GradeLockSetting"("org_id", "school_year_id");
