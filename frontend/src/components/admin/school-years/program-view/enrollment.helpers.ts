// frontend\src\components\admin\enrollment\program-view\enrollment.helpers.ts
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
} from "@/types/admin/student-enrollment.types";

export function getStudentsInProgram(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some((pe) => pe.program_id === programId),
  );
}

export function getStudentsInLevel(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  levelId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) => pe.program_id === programId && pe.level?.id === levelId,
    ),
  );
}

export function getStudentsInCourse(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  courseId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) => pe.program_id === programId && pe.course?.id === courseId,
    ),
  );
}

export function getStudentsInStrand(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  strandId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) => pe.program_id === programId && pe.strand?.id === strandId,
    ),
  );
}

export function getStudentsInCourseLevel(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  courseId: string,
  levelId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) =>
        pe.program_id === programId &&
        pe.course?.id === courseId &&
        pe.level?.id === levelId,
    ),
  );
}

export function getStudentsInStrandLevel(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  strandId: string,
  levelId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) =>
        pe.program_id === programId &&
        pe.strand?.id === strandId &&
        pe.level?.id === levelId,
    ),
  );
}

export function getProgramEnrollment(
  enrollment: StudentSchoolYearEnrollment,
  programId: string,
): ProgramEnrollmentSnapshot | undefined {
  return enrollment.programEnrollments?.find(
    (pe) => pe.program_id === programId,
  );
}

/** Filter students by section — "all" returns everything */
export function filterBySection(
  students: StudentSchoolYearEnrollment[],
  programId: string,
  sectionFilter: string, // "all" | section id | "none"
): StudentSchoolYearEnrollment[] {
  if (sectionFilter === "all") return students;
  return students.filter((e) => {
    const pe = getProgramEnrollment(e, programId);
    if (sectionFilter === "none") return !pe?.section;
    return pe?.section?.id === sectionFilter;
  });
}