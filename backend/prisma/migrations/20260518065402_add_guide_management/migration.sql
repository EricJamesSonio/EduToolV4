-- CreateEnum
CREATE TYPE "GuidePortal" AS ENUM ('admin', 'student', 'educator');

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "portal" "GuidePortal" NOT NULL,
    "page_path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" TEXT NOT NULL,
    "guide_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guide_portal_page_path_key" ON "Guide"("portal", "page_path");

-- CreateIndex
CREATE UNIQUE INDEX "GuideStep_guide_id_order_index_key" ON "GuideStep"("guide_id", "order_index");

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
