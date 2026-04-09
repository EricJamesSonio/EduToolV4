-- CreateTable
CREATE TABLE "SemesterTemplate" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SemesterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterTemplateItem" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "SemesterTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterTemplateTerm" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "SemesterTemplateTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSemesterAssignment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,

    CONSTRAINT "ProgramSemesterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSemesterAssignment_program_id_key" ON "ProgramSemesterAssignment"("program_id");

-- AddForeignKey
ALTER TABLE "SemesterTemplateItem" ADD CONSTRAINT "SemesterTemplateItem_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "SemesterTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterTemplateTerm" ADD CONSTRAINT "SemesterTemplateTerm_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "SemesterTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSemesterAssignment" ADD CONSTRAINT "ProgramSemesterAssignment_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSemesterAssignment" ADD CONSTRAINT "ProgramSemesterAssignment_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "SemesterTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
