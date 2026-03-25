import { Injectable, ForbiddenException } from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { ClassRepository } from '@/modules/class/class.repository';

@Injectable()
export class GradeStudentService {
  constructor(
    private readonly gradeRepo: GradeRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  async getMyGrades(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    // ✅ Guard: student must be enrolled
    const enrollment = await this.classRepo.findEnrolledClassByStudent(
      classId,
      studentId,
      orgId,
    );

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this class.');
    }

    // ✅ Get ALL term grades
    const grades = await this.gradeRepo.findByClass(classId, orgId);

    // ✅ Filter only this student
    const myGrades = grades.filter(g => g.student_id === studentId);

    // ✅ Apply visibility rules
    return myGrades.map(g => ({
      termId: g.term_id,
      finalScore: g.final_score,
      finalGrade: g.is_locked ? g.final_grade : null, // 🔥 key rule
      isReleased: g.is_locked,
    }));
  }
}