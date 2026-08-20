-- CreateTable
CREATE TABLE "SchoolProfileDepartment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProfileDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileCourse" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "SchoolProfileCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileStrand" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SchoolProfileStrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileLevel" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "course_id" TEXT,
    "strand_id" TEXT,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "SchoolProfileLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileSection" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "SchoolProfileSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileSubject" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "department_id" TEXT,
    "level_id" TEXT,
    "name" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL DEFAULT 'major',

    CONSTRAINT "SchoolProfileSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfileSubjectSharing" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "course_id" TEXT,
    "strand_id" TEXT,

    CONSTRAINT "SchoolProfileSubjectSharing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileDepartment_org_id_type_key" ON "SchoolProfileDepartment"("org_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileSubjectSharing_subject_id_course_id_key" ON "SchoolProfileSubjectSharing"("subject_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileSubjectSharing_subject_id_strand_id_key" ON "SchoolProfileSubjectSharing"("subject_id", "strand_id");

-- AddForeignKey
ALTER TABLE "SchoolProfileCourse" ADD CONSTRAINT "SchoolProfileCourse_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "SchoolProfileDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileStrand" ADD CONSTRAINT "SchoolProfileStrand_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "SchoolProfileDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileLevel" ADD CONSTRAINT "SchoolProfileLevel_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "SchoolProfileDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileLevel" ADD CONSTRAINT "SchoolProfileLevel_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "SchoolProfileCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileLevel" ADD CONSTRAINT "SchoolProfileLevel_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "SchoolProfileStrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileSection" ADD CONSTRAINT "SchoolProfileSection_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "SchoolProfileLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileSubject" ADD CONSTRAINT "SchoolProfileSubject_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "SchoolProfileDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileSubject" ADD CONSTRAINT "SchoolProfileSubject_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "SchoolProfileLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileSubjectSharing" ADD CONSTRAINT "SchoolProfileSubjectSharing_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "SchoolProfileSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileSubjectSharing" ADD CONSTRAINT "SchoolProfileSubjectSharing_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "SchoolProfileCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolProfileSubjectSharing" ADD CONSTRAINT "SchoolProfileSubjectSharing_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "SchoolProfileStrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
