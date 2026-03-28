import { Injectable, ForbiddenException } from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { EnrollmentRepository } from 'src/modules/enrollment/enrollment.repository';

@Injectable()
export class GradeStudentService {
  constructor(
    private readonly gradeRepo: GradeRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
  ) {}

  async getMyGrades(classId: string, studentId: string, orgId: string) {
    const enrollment = await this.enrollmentRepo.findOneByStudentAndClass(
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
        finalGrade: g.is_locked ? g.final_grade : null,
        isReleased: g.is_locked,
      }));
  }
}