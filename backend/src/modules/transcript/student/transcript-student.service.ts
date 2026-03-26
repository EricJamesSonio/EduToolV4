// @/modules/transcript/student/transcript-student.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradeRepository } from '@/modules/grade/grade.repository';
import { ClassRepository } from '@/modules/class/class.repository';

@Injectable()
export class TranscriptStudentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gradeRepo: GradeRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  async getMyTranscript(studentId: string, orgId: string) {
    // 1. Get all active enrollments with full class context
    const enrollments = await this.classRepo.findEnrolledClassesByStudent(
      studentId,
      orgId,
    );

    if (enrollments.length === 0) return [];

    // 2. For each enrollment, gather all grades + term/semester/school-year context
    const classEntries = await Promise.all(
      enrollments.map(async (enrollment) => {
        const cls = enrollment.class;

        // Parallel: subject, educator profile, semester (with terms), school year, grades
        const [subject, educatorProfile, semester, schoolYear, grades] =
          await Promise.all([
            this.db.subject.findFirst({
              where: { id: cls.subject_id, org_id: orgId },
              select: { id: true, name: true },
            }),
            this.db.profile.findFirst({
              where: { account: { id: cls.educator_id } },
              select: { full_name: true },
            }),
            this.db.semester.findUnique({
              where: { id: cls.semester_id },
              include: { terms: { orderBy: { order_index: 'asc' } } },
            }),
            this.db.schoolYear.findFirst({
              where: { id: cls.school_year_id, org_id: orgId },
              select: { id: true, name: true, status: true },
            }),
            this.gradeRepo.findByClass(cls.id, orgId),
          ]);

        // 3. Map grades by term_id for O(1) lookup
        const gradeByTerm = new Map(
          grades
            .filter((g) => g.student_id === studentId)
            .map((g) => [g.term_id, g]),
        );

        // 4. Build per-term grade rows
        const termGrades = (semester?.terms ?? []).map((term) => {
          const grade = gradeByTerm.get(term.id) ?? null;
          return {
            termId: term.id,
            termName: term.name,
            orderIndex: term.order_index,
            finalScore: grade?.final_score ?? null,
            finalGrade: grade?.is_locked ? grade.final_grade : null, // 🔒 visibility rule
            isReleased: grade?.is_locked ?? false,
          };
        });

        return {
          classId: cls.id,
          subject: {
            id: subject?.id ?? null,
            name: subject?.name ?? 'Unknown Subject',
          },
          educator: educatorProfile?.full_name ?? 'Unknown Educator',
          schoolYear: {
            id: schoolYear?.id ?? null,
            name: schoolYear?.name ?? 'Unknown',
            status: schoolYear?.status ?? 'unknown',
          },
          semester: {
            id: semester?.id ?? null,
            name: semester?.name ?? 'Unknown Semester',
          },
          termGrades,
        };
      }),
    );

    // 5. Group by school year → semester
    const grouped = this.groupTranscript(classEntries);

    return grouped;
  }

  // ── Group: schoolYear → semester → [classes] ─────────────────────────────

  private groupTranscript(
    entries: Awaited<ReturnType<typeof this.flatEntries>>,
  ) {
    const schoolYearMap = new Map<
      string,
      {
        schoolYearId: string;
        schoolYearName: string;
        schoolYearStatus: string;
        semesters: Map<
          string,
          {
            semesterId: string;
            semesterName: string;
            classes: typeof entries;
          }
        >;
      }
    >();

    for (const entry of entries) {
      const syId = entry.schoolYear.id ?? 'unknown';
      const semId = entry.semester.id ?? 'unknown';

      if (!schoolYearMap.has(syId)) {
        schoolYearMap.set(syId, {
          schoolYearId: syId,
          schoolYearName: entry.schoolYear.name,
          schoolYearStatus: entry.schoolYear.status,
          semesters: new Map(),
        });
      }

      const sy = schoolYearMap.get(syId)!;

      if (!sy.semesters.has(semId)) {
        sy.semesters.set(semId, {
          semesterId: semId,
          semesterName: entry.semester.name,
          classes: [],
        });
      }

      sy.semesters.get(semId)!.classes.push(entry);
    }

    // Serialize Maps → arrays
    return Array.from(schoolYearMap.values()).map((sy) => ({
      schoolYearId: sy.schoolYearId,
      schoolYearName: sy.schoolYearName,
      schoolYearStatus: sy.schoolYearStatus,
      semesters: Array.from(sy.semesters.values()).map((sem) => ({
        semesterId: sem.semesterId,
        semesterName: sem.semesterName,
        classes: sem.classes.map((c) => ({
          classId: c.classId,
          subject: c.subject,
          educator: c.educator,
          termGrades: c.termGrades,
        })),
      })),
    }));
  }

  // dummy type helper for groupTranscript param inference
  private flatEntries() {
    return [] as {
      classId: string;
      subject: { id: string | null; name: string };
      educator: string;
      schoolYear: { id: string | null; name: string; status: string };
      semester: { id: string | null; name: string };
      termGrades: {
        termId: string;
        termName: string;
        orderIndex: number;
        finalScore: number | null;
        finalGrade: string | null;
        isReleased: boolean;
      }[];
    }[];
  }
}