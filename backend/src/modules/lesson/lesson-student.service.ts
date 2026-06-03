import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';

@Injectable()
export class LessonStudentService {
  constructor(
    private readonly lessonRepo: LessonRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
  ) {}

  async getStudentLessons(
    classId: string,
    studentId: string,
    orgId: string,
    weekNumber?: number,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);
    return this.lessonRepo.findAllForStudent(classId, orgId, weekNumber);
  }

  async getStudentLesson(
    classId: string,
    lessonId: string,
    studentId: string,
    orgId: string,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);
    const lesson = await this.lessonRepo.findByIdForStudent(lessonId, orgId);
    if (!lesson || lesson.class_id !== classId) {
      throw new NotFoundException('Lesson not found.');
    }
    return lesson;
  }

  private async assertStudentEnrolled(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const enrollment = await this.enrollmentRepo.findOneByStudentAndClass(
      classId,
      studentId,
      orgId,
    );
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this class.');
    }
  }
}
