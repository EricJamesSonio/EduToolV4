-- CreateTable
CREATE TABLE "SchoolProfileGradingScale" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ranges" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProfileGradingScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileGradingScheme" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProfileGradingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileSemesterTermConfig" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_type" TEXT NOT NULL,
    "terms" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProfileSemesterTermConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileGradingScale_org_id_program_type_key" ON "SchoolProfileGradingScale"("org_id", "program_type");
CREATE UNIQUE INDEX "SchoolProfileGradingScale_org_id_name_key" ON "SchoolProfileGradingScale"("org_id", "name");
CREATE INDEX "SchoolProfileGradingScale_org_id_idx" ON "SchoolProfileGradingScale"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileGradingScheme_org_id_program_type_key" ON "SchoolProfileGradingScheme"("org_id", "program_type");
CREATE UNIQUE INDEX "SchoolProfileGradingScheme_org_id_name_key" ON "SchoolProfileGradingScheme"("org_id", "name");
CREATE INDEX "SchoolProfileGradingScheme_org_id_idx" ON "SchoolProfileGradingScheme"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileSemesterTermConfig_org_id_program_type_key" ON "SchoolProfileSemesterTermConfig"("org_id", "program_type");
CREATE INDEX "SchoolProfileSemesterTermConfig_org_id_idx" ON "SchoolProfileSemesterTermConfig"("org_id");
