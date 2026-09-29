// @/modules/transcript/student/transcript-student.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradeRepository } from '@/modules/grade/grade.repository';
import { ClassRepository } from '@/modules/class/class.repository';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';

type TermGradeEntry = {
  termId: string;
  termName: string;
  orderIndex: number;
  finalScore: number | null;
  finalGrade: string | null;
  isReleased: boolean;
};

type TranscriptEntry = {
  classId: string;
  subject: { id: string | null; name: string };
  educator: string;
  schoolYear: { id: string | null; name: string; status: string };
  semesterName: string;
  termGrades: TermGradeEntry[];
};

@Injectable()
export class TranscriptStudentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gradeRepo: GradeRepository,
    private readonly classRepo: ClassRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
  ) {}

  async getMyTranscript(studentId: string, orgId: string) {
    const enrollments = await this.enrollmentRepo.findByStudentAcrossOrg(
      studentId,
      orgId,
    );

    if (enrollments.length === 0) return [];

    // Perf Phase 3: fetch every enrollment's lookups in 4 batched queries
    // instead of 5 queries per enrollment (1 + 9E for E enrollments).
    const classes = enrollments.map((enrollment) => enrollment.class);
    const classIds = [...new Set(classes.map((cls) => cls.id))];
    const subjectIds = [...new Set(classes.map((cls) => cls.subject_id))];
    const educatorIds = [...new Set(classes.map((cls) => cls.educator_id))];
    const schoolYearIds = [...new Set(classes.map((cls) => cls.school_year_id))];

    const [subjects, profiles, schoolYears, allGrades] = await Promise.all([
      this.db.subject.findMany({
        where: { id: { in: subjectIds }, org_id: orgId },
        select: { id: true, name: true },
      }),
      this.db.profile.findMany({
        where: { account_id: { in: educatorIds } },
        select: { account_id: true, full_name: true },
      }),
      this.db.schoolYear.findMany({
        where: { id: { in: schoolYearIds }, org_id: orgId },
        select: { id: true, name: true, status: true },
      }),
      this.gradeRepo.findByClasses(classIds, orgId),
    ]);

    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const profileByAccountId = new Map(profiles.map((p) => [p.account_id, p]));
    const schoolYearById = new Map(schoolYears.map((y) => [y.id, y]));
    const gradesByClass = new Map<string, typeof allGrades>();
    for (const grade of allGrades) {
      const list = gradesByClass.get(grade.class_id);
      if (list) list.push(grade);
      else gradesByClass.set(grade.class_id, [grade]);
    }

    // Template terms resolve through the class → subject → program chain, so
    // classes sharing a subject share the result — resolve once per subject.
    const classIdBySubject = new Map<string, string>();
    for (const cls of classes) {
      if (!classIdBySubject.has(cls.subject_id)) {
        classIdBySubject.set(cls.subject_id, cls.id);
      }
    }
    const termsPerSubject = await Promise.all(
      [...classIdBySubject.entries()].map(async ([subjectId, classId]) => ({
        subjectId,
        terms: await this.gradeRepo.findTemplateTermsByClass(classId, orgId),
      })),
    );
    const termsBySubject = new Map(
      termsPerSubject.map((entry) => [entry.subjectId, entry.terms]),
    );

    const classEntries: TranscriptEntry[][] = enrollments.map((enrollment) => {
      const cls = enrollment.class;

      const subject = subjectById.get(cls.subject_id) ?? null;
      const educatorProfile = profileByAccountId.get(cls.educator_id) ?? null;
      const schoolYear = schoolYearById.get(cls.school_year_id) ?? null;
      const grades = gradesByClass.get(cls.id) ?? [];
      const templateTerms = termsBySubject.get(cls.subject_id) ?? [];

      const gradeByTerm = new Map(
        grades
          .filter((g) => g.student_id === studentId)
          .map((g) => [g.term_id, g]),
      );

        // Group template terms by semester
        const semMap = new Map<string, TermGradeEntry[]>();

        for (const tt of templateTerms) {
          const grade = gradeByTerm.get(tt.id) ?? null;
          const entry: TermGradeEntry = {
            termId: tt.id,
            termName: tt.name,
            orderIndex: 0,
            finalScore: grade?.final_score ?? null,
            finalGrade: grade?.is_locked ? grade.final_grade : null,
            isReleased: grade?.is_locked ?? false,
          };

          const semKey = tt.semesterName;
          if (!semMap.has(semKey)) {
            semMap.set(semKey, []);
          }
          semMap.get(semKey)!.push(entry);
        }

        // Flatten: create one TranscriptEntry per semester with its term grades
        const semEntries: TranscriptEntry[] = [];
        for (const [semName, termGrades] of semMap) {
          termGrades.sort((a, b) => a.orderIndex - b.orderIndex);
          semEntries.push({
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
            semesterName: semName,
            termGrades,
          });
        }

        return semEntries;
      },
    );

    // Flatten nested arrays
    const flat = classEntries.flat();
    return this.groupTranscript(flat);
  }

  private groupTranscript(entries: TranscriptEntry[]) {
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
            classes: TranscriptEntry[];
          }
        >;
      }
    >();

    for (const entry of entries) {
      const syId = entry.schoolYear.id ?? 'unknown';
      const semId = entry.semesterName;

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
          semesterName: semId,
          classes: [],
        });
      }

      sy.semesters.get(semId)!.classes.push(entry);
    }

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
}
