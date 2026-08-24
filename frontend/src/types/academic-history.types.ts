export interface FullHistorySchoolYear {
  studentSchoolYearId: string;
  schoolYear: { id: string; name: string; status: string };
  enrolledAt: string;
  unenrolledAt: string | null;
  programEnrollments: {
    id: string;
    program: { id: string; name: string; type?: string };
    level: { id: string; name: string } | null;
    course: { id: string; name: string; code?: string | null } | null;
    strand: { id: string; name: string } | null;
    section: { id: string; name: string } | null;
    status: string;
    enrolledAt: string;
    sectionAssignedAt: string | null;
    endReason: string | null;
    endedAt: string | null;
  }[];
  enrollments: {
    id: string;
    status: string;
    outcome: string | null;
    class: { id: string; subject?: { id: string; name: string } | null };
  }[];
  shiftEvents: unknown[];
  requests: unknown[];
}
