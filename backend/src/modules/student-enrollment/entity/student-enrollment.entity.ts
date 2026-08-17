export class StudentSchoolYearEntity {
  id!: string;
  org_id!: string;
  student_id!: string;
  school_year_id!: string;
  status!: string;
  enrolled_at!: Date;
  unenrolled_at!: Date | null;
  notes!: string | null;
}

export class StudentProgramEnrollmentEntity {
  id!: string;
  org_id!: string;
  student_school_year_id!: string;
  program_id!: string;
  level_id!: string | null;
  course_id!: string | null;
  strand_id!: string | null;
  section_id!: string | null;
  status!: string;
  enrolled_at!: Date;
}
