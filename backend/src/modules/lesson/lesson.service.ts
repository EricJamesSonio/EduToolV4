// @/modules/lesson/lesson.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateLessonDto, UpdateLessonDto, QueryLessonDto } from './dto/lesson.dto';
import { ClassRepository } from '../class/class.repository';

// Minimum word count for concept extraction to be triggered
const MIN_DETAIL_WORDS = 10;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepo: LessonRepository,
    private readonly classRepo: ClassRepository,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  // ───────── CREATE ─────────

  async create(
    classId: string,
    orgId: string,
    educatorId: string,
    dto: CreateLessonDto,
  ) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    if (countWords(dto.detail) < MIN_DETAIL_WORDS) {
      throw new BadRequestException('Lesson detail must be at least 10 words.');
    }

    const existing = await this.lessonRepo.findByClassAndWeek(
      classId,
      orgId,
      dto.weekNumber,
      dto.subIndex,
    );
    if (existing) {
      throw new BadRequestException(
        `A lesson already exists at Week ${dto.weekNumber}, Sub-index ${dto.subIndex}.`,
      );
    }

    const lesson = await this.lessonRepo.create({
      orgId,
      classId,
      title: dto.title,
      description: dto.description,
      weekNumber: dto.weekNumber,
      subIndex: dto.subIndex,
      detail: dto.detail,
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'lesson_created',
      entityType: 'class',
      entityId: classId,
      metadata: { lessonId: lesson.id, title: lesson.title },
    });

    this.triggerConceptExtraction(lesson.id, orgId, educatorId, dto.detail).catch(
      () => {},
    );

    return lesson;
  }

  // ───────── FIND ALL (educator) ─────────

  async findAll(
    classId: string,
    orgId: string,
    educatorId: string,
    query: QueryLessonDto,
  ) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    return this.lessonRepo.findAll(classId, orgId, query.weekNumber);
  }

  // ───────── FIND ONE (educator) ─────────

  async findOne(id: string, orgId: string, educatorId: string) {
    const lesson = await this.lessonRepo.findById(id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const cls = await this.classRepo.findById(lesson.class_id, orgId);
    if (cls?.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    const concept = await this.lessonRepo.findConcept(id);

    return { ...lesson, concept: concept ?? null };
  }

  // ───────── UPDATE ─────────

  async update(
    id: string,
    orgId: string,
    educatorId: string,
    dto: UpdateLessonDto,
  ) {
    const lesson = await this.lessonRepo.findById(id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const cls = await this.classRepo.findById(lesson.class_id, orgId);
    if (cls?.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    if (dto.detail !== undefined && countWords(dto.detail) < MIN_DETAIL_WORDS) {
      throw new BadRequestException('Lesson detail must be at least 10 words.');
    }

    if (dto.weekNumber !== undefined || dto.subIndex !== undefined) {
      const newWeek = dto.weekNumber ?? lesson.week_number;
      const newSub = dto.subIndex ?? lesson.sub_index;

      const conflict = await this.lessonRepo.findByClassAndWeek(
        lesson.class_id,
        orgId,
        newWeek,
        newSub,
      );

      if (conflict && conflict.id !== id) {
        throw new BadRequestException(
          `A lesson already exists at Week ${newWeek}, Sub-index ${newSub}.`,
        );
      }
    }

    const updated = await this.lessonRepo.update(id, {
      title: dto.title,
      description: dto.description,
      weekNumber: dto.weekNumber,
      subIndex: dto.subIndex,
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'lesson_updated',
      entityType: 'class',
      entityId: lesson.class_id,
      metadata: { lessonId: id },
    });

    return updated;
  }

  // ───────── DELETE ─────────

  async delete(id: string, orgId: string, educatorId: string) {
    const lesson = await this.lessonRepo.findById(id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const cls = await this.classRepo.findById(lesson.class_id, orgId);
    if (cls?.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    await this.lessonRepo.delete(id);

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'lesson_updated',
      entityType: 'class',
      entityId: lesson.class_id,
      metadata: { lessonId: id, action: 'deleted' },
    });

    return { success: true };
  }

  // ───────── GET CONCEPT ─────────

  async getConcept(id: string, orgId: string, educatorId: string) {
    const lesson = await this.lessonRepo.findById(id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const cls = await this.classRepo.findById(lesson.class_id, orgId);
    if (cls?.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    const concept = await this.lessonRepo.findConcept(id);
    if (!concept) throw new NotFoundException('No concept build found for this lesson.');

    return concept;
  }

  // ───────── RE-EXTRACT CONCEPT ─────────

  async reExtractConcept(
    id: string,
    orgId: string,
    educatorId: string,
    detail: string,
  ) {
    const lesson = await this.lessonRepo.findById(id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found.');

    const cls = await this.classRepo.findById(lesson.class_id, orgId);
    if (cls?.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    if (countWords(detail) < MIN_DETAIL_WORDS) {
      throw new BadRequestException('Lesson detail must be at least 10 words.');
    }

    this.triggerConceptExtraction(id, orgId, educatorId, detail).catch(() => {});

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'concept_extraction_requested',
      entityType: 'class',
      entityId: lesson.class_id,
      metadata: { lessonId: id },
    });

    return { success: true, message: 'Concept extraction started.' };
  }

  // ───────── STUDENT: GET LESSONS ─────────

  /**
   * Returns all lessons for a class the student is enrolled in.
   * Concept data is intentionally excluded — educator-only.
   * weekNumber filter is optional.
   */
  async getStudentLessons(
    classId: string,
    studentId: string,
    orgId: string,
    weekNumber?: number,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);
    return this.lessonRepo.findAllForStudent(classId, orgId, weekNumber);
  }

  // ───────── STUDENT: GET LESSON DETAIL ─────────

  /**
   * Returns a single lesson for a student.
   * Concept data is intentionally excluded — educator-only.
   */
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

  // ───────── PRIVATE HELPERS ─────────

  /**
   * Verifies the student has an active enrollment in the class.
   * Throws ForbiddenException if not enrolled.
   */
  private async assertStudentEnrolled(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const enrollment = await this.classRepo.findEnrolledClassByStudent(
      classId,
      studentId,
      orgId,
    );
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this class.');
    }
  }

  private async triggerConceptExtraction(
    lessonId: string,
    orgId: string,
    educatorId: string,
    detail: string,
  ) {
    const mockContent = this.mockExtract(detail);

    await this.lessonRepo.upsertConcept({
      orgId,
      lessonId,
      content: mockContent,
    });

    await this.notificationService.createNotification({
      orgId,
      accountId: educatorId,
      type: 'concept_extraction_completed',
      payload: { lessonId },
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'concept_extraction_completed',
      entityType: 'class',
      entityId: lessonId,
      metadata: { lessonId },
    });
  }

  private mockExtract(detail: string): object {
    const words = detail.trim().split(/\s+/);
    const chunkSize = Math.ceil(words.length / 3);
    const sections: Array<{ name: string; summary: string; items: number }> = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      sections.push({
        name: `Section ${Math.floor(i / chunkSize) + 1}`,
        summary: chunk,
        items: Math.min(chunkSize, words.length - i),
      });
    }

    return { sections, totalItems: words.length };
  }
}