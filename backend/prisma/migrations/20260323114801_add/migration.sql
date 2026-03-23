-- CreateTable
CREATE TABLE "GradingScale" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ranges" JSONB NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingScale_pkey" PRIMARY KEY ("id")
);
