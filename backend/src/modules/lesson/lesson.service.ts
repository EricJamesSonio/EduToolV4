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
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';
import { SemesterTemplateRepository } from '../semester-template/semester-template.repository';
import { AiService } from '@/core/ai/ai.service';

const MIN_DETAIL_WORDS = 10;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepo: LessonRepository,
    private readonly classRepo: ClassRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly aiService: AiService,
    private readonly semesterTemplateRepo: SemesterTemplateRepository,
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

    this.triggerConceptExtraction(lesson.id, orgId, educatorId, dto.detail).catch(() => {});

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

async getWeekStructure(classId: string, orgId: string, educatorId: string) {
  const cls = await this.classRepo.findById(classId, orgId);
  if (!cls) throw new NotFoundException('Class not found.');

  if (cls.educator_id !== educatorId) {
    throw new ForbiddenException('You do not own this class.');
  }

  const classWeekday =
    cls.schedules && cls.schedules.length > 0
      ? cls.schedules[0].weekday
      : 1;

  const subject = await this.classRepo['db'].subject.findFirst({
    where: { id: cls.subject_id },
    select: { program_id: true },
  });

  if (!subject?.program_id) {
    throw new BadRequestException(
      'Class subject is not linked to a program.',
    );
  }

  const assignment =
    await this.semesterTemplateRepo.findAssignmentByProgram(
      subject.program_id,
      orgId,
    );

  if (!assignment) {
    throw new BadRequestException(
      'No semester template assigned to this program.',
    );
  }

  const termDatesMap = new Map<string, { start: Date; end: Date }>();

  for (const td of (assignment as any).termDates ?? []) {
    termDatesMap.set(td.term_id, {
      start: new Date(td.start_date),
      end: new Date(td.end_date),
    });
  }

  type WeekSlot = {
    label: string;

    value: number;
    globalWeek: number;

    termWeek: number;
    semesterWeek: number;

    termName: string;
    semesterName: string;
    semesterIndex: number;

    date: string;
  };

  const result: WeekSlot[] = [];

  const semesters = assignment.template.semesters ?? [];

  let globalWeek = 1;

  for (let si = 0; si < semesters.length; si++) {
    const sem = semesters[si];
    const terms = sem.terms ?? [];

    let semesterWeek = 1; // 🔥 reset per semester

    for (const term of terms) {
      const dates = termDatesMap.get(term.id);

      if (!dates) {
        throw new BadRequestException(
          `Term "${term.name}" in semester "${sem.name}" has no date range configured.`,
        );
      }

      const occurrences = this.getWeekdayOccurrences(
        dates.start,
        dates.end,
        classWeekday,
      );

      let termWeek = 1; // 🔥 reset per term

      for (const date of occurrences) {
        result.push({
          label: `${term.name} Week ${termWeek}`, // 🔥 human readable

          value: globalWeek,
          globalWeek,

          termWeek,
          semesterWeek,

          termName: term.name,
          semesterName: sem.name,
          semesterIndex: si + 1,

          date: date.toISOString(),
        });

        globalWeek++;
        termWeek++;
        semesterWeek++;
      }
    }
  }

  return result;
}

private getWeekdayOccurrences(
  start: Date,
  end: Date,
  weekday: number, // 0=Sunday, 1=Monday, etc.
): Date[] {
  const dates: Date[] = [];

  const current = new Date(start);

  // Move to first matching weekday
  const diff = (weekday - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + diff);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
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

  private async triggerConceptExtraction(
    lessonId: string,
    orgId: string,
    educatorId: string,
    detail: string,
  ) {
    const conceptBuild = await this.aiService.extractConcepts(detail);

    await this.lessonRepo.upsertConcept({
      orgId,
      lessonId,
      content: conceptBuild as any,
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

async syncLessonsFromAttendance(classId: string, orgId: string) {
  const sessions = await this.db.attendanceSession.findMany({
    where: { class_id: classId },
    orderBy: [{ week_number: 'asc' }, { sub_index: 'asc' }],
  });

  if (!sessions.length) return;

  // Get all existing lessons
  const existingLessons = await this.lessonRepo.findAll(classId, orgId);

  const lessonMap = new Map(
    existingLessons.map((l) => [
      `${l.week_number}-${l.sub_index}`,
      l,
    ]),
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
      // OPTIONAL: keep lesson aligned (safe overwrite mode)
      await this.lessonRepo.update(existing.id, {
        weekNumber: session.week_number,
        subIndex: session.sub_index,
      });
    }
  }
}
}