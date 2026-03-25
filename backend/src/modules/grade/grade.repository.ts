// @/modules/grade/grade.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradeRepository {
  constructor(private db: DatabaseService) {}

  // ───────── FIND / QUERY ─────────

  async findByClass(classId: string, orgId: string) {
    return this.db.grade.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
      },
    });
  }

  async findByStudent(
    studentId: string,
    classId: string,
    termId: string,
    orgId: string,
  ) {
    return this.db.grade.findFirst({
      where: {
        student_id: studentId,
        class_id: classId,
        term_id: termId,
        org_id: orgId,
      },
    });
  }

  // ───────── UPSERT ─────────

  async upsert(data: {
    orgId: string;
    studentId: string;
    classId: string;
    termId: string;
    finalScore: number;
    finalGrade: string;
  }) {
    return this.db.grade.upsert({
      where: {
        org_id_student_id_class_id_term_id: { // ✅ snake_case to match Prisma schema
          org_id: data.orgId,
          student_id: data.studentId,
          class_id: data.classId,
          term_id: data.termId,
        },
      },
      update: {
        final_score: data.finalScore,
        final_grade: data.finalGrade,
      },
      create: {
        org_id: data.orgId,
        student_id: data.studentId,
        class_id: data.classId,
        term_id: data.termId,
        final_score: data.finalScore,
        final_grade: data.finalGrade,
      },
    });
  }

  // ───────── LOCK / UNLOCK ─────────

  async publishByClass(classId: string, orgId: string) {
    return this.db.grade.updateMany({
      where: {
        class_id: classId,
        org_id: orgId,
      },
      data: {
        is_locked: true,
        locked_at: new Date(),
      },
    });
  }

  async unlockByClass(classId: string, orgId: string) {
    return this.db.grade.updateMany({
      where: {
        class_id: classId,
        org_id: orgId,
      },
      data: {
        is_locked: false,
        locked_at: null,
      },
    });
  }
}