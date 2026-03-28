export class SubjectEntity {
  id: string;
  orgId: string;
  name: string;
  levelId: string;
  courseId: string | null;   // null = open/minor (any course), set = course-coupled major
  strandId: string | null;   // for SHS strands
  educatorId: string | null;
  isLocked: boolean;
  yearLevel: string | null;  // e.g. "1st Year", "Grade 11"
  termLabel: string | null;  // e.g. "1st Sem"
}