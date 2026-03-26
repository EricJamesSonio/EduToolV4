// src/modules/grade/student/grade-student.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { ClassRepository } from 'src/modules/class/class.repository';

@Injectable()
export class GradeStudentService {
  constructor(
    private readonly gradeRepo: GradeRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  async getMyGrades(classId: string, studentId: string, orgId: string) {
    // Guard: student must be enrolled in this class
    const enrollment = await this.classRepo.findEnrolledClassByStudent(
      classId,
      studentId,
      orgId,
    );

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this class.');
    }

    const grades = await this.gradeRepo.findByClass(classId, orgId);

    return grades
      .filter((g) => g.student_id === studentId)
      .map((g) => ({
        termId: g.term_id,
        finalScore: g.final_score,
        finalGrade: g.is_locked ? g.final_grade : null, // 🔒 only visible when released
        isReleased: g.is_locked,
      }));
  }
}