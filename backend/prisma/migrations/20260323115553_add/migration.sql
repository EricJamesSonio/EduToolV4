-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "educator_id" TEXT,
    "class_id" TEXT,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "categories" JSONB NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);
