import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ClassRepository } from '../class/class.repository';
import { AttendanceRepository } from '../attendance/attendance.repository';
import { LessonConceptService } from './lesson-concept.service';
import { LessonWeekStructureService } from './lesson-week-structure.service';
import { LessonStudentService } from './lesson-student.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  QueryLessonDto,
} from './dto/lesson.dto';

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
    private readonly attendanceRepo: AttendanceRepository,
    private readonly conceptService: LessonConceptService,
    private readonly weekStructureService: LessonWeekStructureService,
    private readonly studentService: LessonStudentService,
  ) {}

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

    this.conceptService
      .triggerConceptExtraction(lesson.id, orgId, educatorId, dto.detail)
      .catch(() => {});

    return lesson;
  }

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
      detail: dto.detail,
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
      action: 'lesson_deleted',
      entityType: 'class',
      entityId: lesson.class_id,
      metadata: { lessonId: id, action: 'deleted' },
    });
    return { success: true };
  }

  async getConcept(id: string, orgId: string, educatorId: string) {
    return this.conceptService.getConcept(id, orgId, educatorId);
  }

  async reExtractConcept(
    id: string,
    orgId: string,
    educatorId: string,
    detail: string,
  ) {
    return this.conceptService.reExtractConcept(id, orgId, educatorId, detail);
  }

  async conceptBuild(
    id: string,
    orgId: string,
    educatorId: string,
    detail: string,
  ) {
    return this.conceptService.conceptBuild(id, orgId, educatorId, detail);
  }

  async getStudentLessons(
    classId: string,
    studentId: string,
    orgId: string,
    weekNumber?: number,
  ) {
    return this.studentService.getStudentLessons(
      classId,
      studentId,
      orgId,
      weekNumber,
    );
  }

  async getStudentLesson(
    classId: string,
    lessonId: string,
    studentId: string,
    orgId: string,
  ) {
    return this.studentService.getStudentLesson(
      classId,
      lessonId,
      studentId,
      orgId,
    );
  }

  async getWeekStructure(classId: string, orgId: string, _educatorId?: string) {
    return this.weekStructureService.getWeekStructure(classId, orgId);
  }

  async syncLessonsFromAttendance(classId: string, orgId: string) {
    const sessions = await this.attendanceRepo.findSessionsByClass(classId);

    if (!sessions.length) return;

    const existingLessons = await this.lessonRepo.findAll(classId, orgId);

    const lessonMap = new Map(
      existingLessons.map((l) => [`${l.week_number}-${l.sub_index}`, l]),
    );

    for (const session of sessions) {
      const key = `${session.week_number}-${session.sub_index}`;

      const existing = lessonMap.get(key);

      if (!existing) {
        await this.lessonRepo.create({
          orgId,
          classId,
          title: `Lesson Week ${session.week_number}`,
          description: `Auto-generated from attendance session`,
          detail: `Auto-generated lesson aligned with attendance schedule.`,
          weekNumber: session.week_number,
          subIndex: session.sub_index,
        });
      } else {
        await this.lessonRepo.update(existing.id, {
          weekNumber: session.week_number,
          subIndex: session.sub_index,
        });
      }
    }
  }
}
