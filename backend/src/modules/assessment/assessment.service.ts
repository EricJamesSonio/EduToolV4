// src/modules/assessment/assessment.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AssessmentRepository } from './assessment.repository';
import { LessonRepository } from '../lesson/lesson.repository';
import { ClassRepository } from '../class/class.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { AttendanceService } from '../attendance/attendance.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
  QueryAssessmentDto,
  PublishScoresDto,
  GradeEssayDto,
  UpdateSubmissionStatusDto,
} from './dto/assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly assessmentRepo: AssessmentRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly classRepo: ClassRepository,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly attendanceService: AttendanceService,
  ) {}

  // ── Ownership guard helpers ───────────────────────────────────────────────

  private async assertEducatorOwnsClass(
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }
    return cls;
  }

  private async assertAssessmentEditable(assessmentId: string, orgId: string) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    if (
      assessment.release_date &&
      new Date() >= new Date(assessment.release_date)
    ) {
      throw new ForbiddenException(
        'Assessment has been released — questions are locked.',
      );
    }

    return assessment;
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  async create(
    classId: string,
    orgId: string,
    educatorId: string,
    dto: CreateAssessmentDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const concept = await this.lessonRepo.findConcept(dto.lessonId);
    if (!concept) {
      throw new BadRequestException(
        'No concept build found for this lesson. Run concept extraction first.',
      );
    }

    const rangeTotal = dto.ranges.reduce(
      (sum, r) => sum + (r.to - r.from + 1),
      0,
    );
    if (rangeTotal !== dto.totalItems) {
      throw new BadRequestException(
        `Item ranges total ${rangeTotal} but totalItems is ${dto.totalItems}. They must match.`,
      );
    }

    const assessment = await this.assessmentRepo.create({
      orgId,
      classId,
      lessonId: dto.lessonId,
      termId: dto.termId,
      type: dto.type,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
    });

    this.generateQuestions(assessment.id, orgId, educatorId, dto).catch(() => {});

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_created',
      entityType: 'class',
      entityId: classId,
      metadata: { assessmentId: assessment.id, type: dto.type },
    });

    return assessment;
  }

  // ── FIND ALL ──────────────────────────────────────────────────────────────

  async findAll(
    classId: string,
    orgId: string,
    educatorId: string,
    query: QueryAssessmentDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    return this.assessmentRepo.findAll(classId, orgId, {
      termId: query.termId,
      type: query.type,
    });
  }

  // ── FIND ONE ──────────────────────────────────────────────────────────────

  async findOne(id: string, orgId: string, educatorId: string) {
    const assessment = await this.assessmentRepo.findById(id, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const questions = await this.assessmentRepo.findQuestions(id);

    return { ...assessment, questions };
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    orgId: string,
    educatorId: string,
    dto: UpdateAssessmentDto,
  ) {
    const assessment = await this.assessmentRepo.findById(id, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const updated = await this.assessmentRepo.update(id, {
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      type: dto.type,
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_edited',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId: id },
    });

    return updated;
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  async delete(id: string, orgId: string, educatorId: string) {
    const assessment = await this.assessmentRepo.findById(id, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    await this.assessmentRepo.softDelete(id);

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_deleted',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId: id },
    });

    return { success: true };
  }

  // ── UPDATE QUESTION ───────────────────────────────────────────────────────

  async updateQuestion(
    assessmentId: string,
    questionId: string,
    orgId: string,
    educatorId: string,
    dto: UpdateQuestionDto,
  ) {
    const assessment = await this.assertAssessmentEditable(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const question = await this.assessmentRepo.findQuestionById(questionId);
    if (!question || question.assessment_id !== assessmentId) {
      throw new NotFoundException('Question not found.');
    }

    return this.assessmentRepo.updateQuestion(questionId, {
      questionText: dto.questionText,
      correctAnswer: dto.correctAnswer,
    });
  }

  // ── GET SUBMISSIONS ───────────────────────────────────────────────────────

  async getSubmissions(
    assessmentId: string,
    orgId: string,
    educatorId: string,
  ) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    return this.assessmentRepo.findSubmissions(assessmentId, orgId);
  }

  // ── UPDATE SUBMISSION STATUS ──────────────────────────────────────────────

  async updateSubmissionStatus(
    assessmentId: string,
    submissionId: string,
    orgId: string,
    educatorId: string,
    dto: UpdateSubmissionStatusDto,
  ) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const submission = await this.assessmentRepo.findSubmissionById(submissionId);
    if (!submission || submission.assessment_id !== assessmentId) {
      throw new NotFoundException('Submission not found.');
    }

    if (dto.status === 'custom' && dto.manualScore === undefined) {
      throw new BadRequestException('manualScore is required for custom status.');
    }

    return this.assessmentRepo.updateSubmissionStatus(submissionId, {
      status: dto.status,
      manualScore: dto.manualScore,
    });
  }

  // ── GRADE ESSAY ───────────────────────────────────────────────────────────

  async gradeEssay(
    assessmentId: string,
    submissionId: string,
    orgId: string,
    educatorId: string,
    dto: GradeEssayDto,
  ) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const submission = await this.assessmentRepo.findSubmissionById(submissionId);
    if (!submission || submission.assessment_id !== assessmentId) {
      throw new NotFoundException('Submission not found.');
    }

    return this.assessmentRepo.gradeEssay(submissionId, dto.score);
  }

  // ── PUBLISH SCORES ────────────────────────────────────────────────────────

  async publishScores(
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: PublishScoresDto,
  ) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    await this.assessmentRepo.update(assessmentId, { isPublished: true });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'score_published',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId, studentIds: dto.studentIds ?? 'all' },
    });

    return { success: true };
  }

  // ── UNPUBLISH SCORES ──────────────────────────────────────────────────────

  async unpublishScores(
    assessmentId: string,
    orgId: string,
    educatorId: string,
  ) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    await this.assessmentRepo.update(assessmentId, { isPublished: false });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'score_unpublished',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId },
    });

    return { success: true };
  }

  // ── FINISH SUBMISSION (student-facing) ────────────────────────────────────
  // Called by SubmissionModule when a student finishes.
  // Auto-marks the student present for today's attendance session.

  async onSubmissionFinished(data: {
    orgId: string;
    classId: string;
    studentId: string;
    submittedAt: Date;
  }) {
    this.attendanceService
      .markPresentFromSubmission({
        orgId: data.orgId,
        classId: data.classId,
        studentId: data.studentId,
        submittedAt: data.submittedAt,
      })
      .catch((err) => {
        console.error(
          `[AttendanceService] Failed to auto-mark present for student ${data.studentId}:`,
          err,
        );
      });
  }

  // ── PRIVATE: GENERATION JOB ───────────────────────────────────────────────

  private async generateQuestions(
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: CreateAssessmentDto,
  ) {
    const questions: Array<{
      orgId: string;
      assessmentId: string;
      type: string;
      questionText: string;
      correctAnswer?: string;
    }> = [];

    let itemNumber = 1;

    for (const range of dto.ranges) {
      const count = range.to - range.from + 1;

      for (let i = 0; i < count; i++) {
        questions.push({
          orgId,
          assessmentId,
          type: range.questionType,
          questionText: `[AI Generated] Item ${itemNumber} — ${range.questionType} from ${range.conceptSections.join(', ')}`,
          correctAnswer:
            range.questionType !== 'essay' ? `Answer ${itemNumber}` : undefined,
        });
        itemNumber++;
      }
    }

    await this.assessmentRepo.createQuestions(questions);

    await this.notificationService.createNotification({
      orgId,
      accountId: educatorId,
      type: 'assessment_generation_completed',
      payload: { assessmentId },
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_questions_generated',
      entityType: 'assessment',
      entityId: assessmentId,
      metadata: { assessmentId, questionsGenerated: questions.length },
    });
  }
}