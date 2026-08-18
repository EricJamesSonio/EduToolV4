import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AssessmentCoreService } from '../core/assessment-core.service';
import { AssessmentRepository } from '../core/assessment-core.repository';
import { ClassRepository } from '@/modules/class/class.repository';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { AttendanceService } from '@/modules/attendance/attendance.service';
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';
import { DatabaseService } from '@/core/database/database.provider';
import { AssessmentCreationHelper } from './helpers/assessment-creation.helper';
import { AssessmentSubmissionHelper } from './helpers/assessment-submission.helper';
import { AssessmentGenerationHelper } from './assessment-generation.helper';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  UpdateQuestionDto,
  QueryAssessmentDto,
  PublishScoresDto,
  GradeEssayDto,
  UpdateSubmissionStatusDto,
  AssignStudentsDto,
  ReopenAssessmentDto,
  SetGradeVisibilityDto,
  GradingMode,
} from '../dto/assessment.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AssessmentEducatorService {
  private readonly logger = new Logger(AssessmentEducatorService.name);

  constructor(
    private readonly repo: AssessmentRepository,
    private readonly core: AssessmentCoreService,
    private readonly db: DatabaseService,
    private readonly classRepo: ClassRepository,
    private readonly auditLog: AuditLogService,
    private readonly attendanceService: AttendanceService,
    private readonly gradeService: GradeEducatorService,
    private readonly creation: AssessmentCreationHelper,
    private readonly submission: AssessmentSubmissionHelper,
    private readonly generation: AssessmentGenerationHelper,
  ) {}

  // ───────── GUARDS ─────────

  private async assertEducatorOwnsClass(
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId)
      throw new ForbiddenException('You do not own this class.');
    return cls;
  }

  private async assertAssessmentEditable(assessmentId: string, orgId: string) {
    const assessment = await this.repo.findById(assessmentId, orgId);
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

  getGenerationStatus(assessmentId: string) {
    return this.generation.getGenerationStatus(assessmentId);
  }

  // ───────── CREATE ─────────

  async create(
    classId: string,
    orgId: string,
    educatorId: string,
    dto: CreateAssessmentDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    await this.creation.assertTypeMatchesScheme(classId, orgId, dto.type);

    const effectiveGradingMode = this.creation.resolveGradingMode(dto);
    const isManual = effectiveGradingMode === GradingMode.MANUAL;

    if (!isManual) await this.creation.validateSystemDto(dto);

    const assessment = await this.creation.createAssessmentRecord(
      orgId,
      classId,
      dto,
      effectiveGradingMode,
    );

    if (isManual) {
      await this.creation.createManualQuestions(orgId, assessment.id, dto);
      const questions = await this.core.getQuestions(assessment.id);
      (assessment as any).questions = questions;
    } else {
      await this.creation.createManualSectionQuestions(
        orgId,
        assessment.id,
        dto,
      );
      const aiRanges = (dto.ranges ?? []).filter(
        (r) => r.questionType !== 'manual',
      );
      if (aiRanges.length > 0) {
        await this.generation.startGeneration(
          assessment.id,
          orgId,
          educatorId,
          { ...dto, ranges: aiRanges },
        );
      }
    }

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_created',
      entityType: 'class',
      entityId: classId,
      metadata: {
        assessmentId: assessment.id,
        type: dto.type,
        gradingMode: effectiveGradingMode,
      },
    });
    return assessment;
  }

  // ───────── READ ─────────

  async findAll(
    classId: string,
    orgId: string,
    educatorId: string,
    query: QueryAssessmentDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const assessments = await this.repo.findAll(classId, orgId, {
      termId: query.termId,
      type: query.type,
      weekNumber: query.weekNumber,
    });
    if (!assessments.length) return [];

    const ids = assessments.map((a) => a.id);

    const [submissionCounts, submittedSubs, essayQuestions, activeReopens] =
      await Promise.all([
        this.db.submission.groupBy({
          by: ['assessment_id', 'status'],
          where: { assessment_id: { in: ids } },
          _count: { id: true },
        }),
        this.db.submission.findMany({
          where: { assessment_id: { in: ids }, status: 'submitted' },
          select: { id: true, assessment_id: true },
        }),
        this.db.question.findMany({
          where: { assessment_id: { in: ids }, type: 'essay' },
          select: { id: true, assessment_id: true },
        }),
        this.db.submission.findMany({
          where: {
            assessment_id: { in: ids },
            reopened_until: { gt: new Date() },
          },
          select: { assessment_id: true, reopened_until: true },
          orderBy: { reopened_until: 'desc' },
        }),
      ]);

    const subToAssessment = new Map(
      submittedSubs.map((s) => [s.id, s.assessment_id]),
    );
    const essayQIds = essayQuestions.map((q) => q.id);

    const pendingEssaySubIds =
      submittedSubs.length && essayQIds.length
        ? await this.db.submissionAnswer.groupBy({
            by: ['submission_id'],
            where: {
              submission_id: { in: submittedSubs.map((s) => s.id) },
              question_id: { in: essayQIds },
              is_correct: null,
            },
            _count: { id: true },
          })
        : [];

    const pendingByAssessment = new Map<string, number>();
    for (const r of pendingEssaySubIds) {
      const assId = subToAssessment.get(r.submission_id);
      if (assId)
        pendingByAssessment.set(
          assId,
          (pendingByAssessment.get(assId) ?? 0) + 1,
        );
    }

    const submittedMap = new Map<string, number>();
    for (const s of submissionCounts) {
      if (s.status === 'submitted')
        submittedMap.set(s.assessment_id, s._count.id);
    }

    const reopenMap = new Map<string, Date>();
    for (const r of activeReopens) {
      if (!reopenMap.has(r.assessment_id))
        reopenMap.set(r.assessment_id, r.reopened_until!);
    }

    return assessments.map((a) => ({
      ...a,
      submittedCount: submittedMap.get(a.id) ?? 0,
      pendingEssayCount: pendingByAssessment.get(a.id) ?? 0,
      reopened_until: reopenMap.get(a.id) ?? null,
    }));
  }

  async findOne(id: string, orgId: string, educatorId: string) {
    const assessment = await this.core.findAssessmentOrThrow(id, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const [questions, activeReopen] = await Promise.all([
      this.core.getQuestions(id),
      this.db.submission.findFirst({
        where: { assessment_id: id, reopened_until: { gt: new Date() } },
        select: { reopened_until: true },
        orderBy: { reopened_until: 'desc' },
      }),
    ]);
    return {
      ...assessment,
      questions,
      generationStatus:
        this.generation.getGenerationStatus(id)?.status ?? 'completed',
      reopenedUntil: activeReopen?.reopened_until ?? null,
    };
  }

  // ───────── UPDATE / DELETE ─────────

  async update(
    id: string,
    orgId: string,
    educatorId: string,
    dto: UpdateAssessmentDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(id, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const updated = await this.repo.update(id, {
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      type: dto.type,
      showBreakdown: dto.showBreakdown,
      gradingMode: dto.gradingMode,
      manualMaxScore: dto.manualMaxScore,
      weekNumber: dto.weekNumber,
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

  async delete(id: string, orgId: string, educatorId: string) {
    const assessment = await this.core.findAssessmentOrThrow(id, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    await this.repo.softDelete(id);
    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_deleted',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId: id },
    });
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(
          assessment.class_id,
          assessment.term_id,
          orgId,
          educatorId,
        )
        .catch((err: Error) =>
          this.logger.error(
            `[Grade] Recompute failed after delete ${id}: ${err.message}`,
          ),
        );
    }
    return { success: true };
  }

  async updateQuestion(
    assessmentId: string,
    questionId: string,
    orgId: string,
    educatorId: string,
    dto: UpdateQuestionDto,
  ) {
    const assessment = await this.assertAssessmentEditable(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const question = await this.repo.findQuestionById(questionId);
    if (!question || question.assessment_id !== assessmentId)
      throw new NotFoundException('Question not found.');
    return this.repo.updateQuestion(questionId, {
      questionText: dto.questionText,
      correctAnswer: dto.correctAnswer,
    });
  }

  // ───────── SUBMISSIONS ─────────

  async getSubmissions(
    assessmentId: string,
    orgId: string,
    educatorId: string,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    return this.submission.getSubmissions(assessment, orgId);
  }

  async updateSubmissionStatus(
    assessmentId: string,
    submissionId: string,
    orgId: string,
    educatorId: string,
    dto: UpdateSubmissionStatusDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const updated = await this.submission.updateSubmissionStatus(
      assessment,
      submissionId,
      orgId,
      dto,
    );
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(
          assessment.class_id,
          assessment.term_id,
          orgId,
          educatorId,
        )
        .catch((err: Error) =>
          this.logger.error(
            `[Grade] Recompute failed after status change: ${err.message}`,
          ),
        );
    }
    return updated;
  }

  async gradeEssay(
    assessmentId: string,
    submissionId: string,
    orgId: string,
    educatorId: string,
    dto: GradeEssayDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    return this.submission.gradeEssay(assessment, submissionId, dto);
  }

  async assignStudents(
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: AssignStudentsDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const result = await this.submission.assignStudents(assessment, orgId, dto);
    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'students_assigned_to_assessment',
      entityType: 'assessment',
      entityId: assessmentId,
      metadata: { assessmentId, studentIds: dto.studentIds },
    });
    return result;
  }

  async reopen(
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: ReopenAssessmentDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const result = await this.submission.reopen(assessment, orgId, dto);
    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_reopened',
      entityType: 'assessment',
      entityId: assessmentId,
      metadata: {
        assessmentId,
        studentIds: dto.studentIds,
        reopenedUntil: dto.reopenedUntil,
      },
    });
    return result;
  }

  // ───────── PUBLISH ─────────

  async publishScores(
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: PublishScoresDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    await this.repo.update(assessmentId, { isPublished: true });
    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'score_published',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId, studentIds: dto.studentIds ?? 'all' },
    });
    await this.gradeService.registerAssessmentForAllStudents(
      assessmentId,
      assessment.class_id,
      orgId,
    );
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(
          assessment.class_id,
          assessment.term_id,
          orgId,
          educatorId,
        )
        .catch((err: Error) =>
          this.logger.error(
            `[Grade] Recompute failed after publish: ${err.message}`,
          ),
        );
    }
    return { success: true };
  }

  async unpublishScores(
    assessmentId: string,
    orgId: string,
    educatorId: string,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    await this.repo.update(assessmentId, { isPublished: false });
    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'score_unpublished',
      entityType: 'class',
      entityId: assessment.class_id,
      metadata: { assessmentId },
    });
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(
          assessment.class_id,
          assessment.term_id,
          orgId,
          educatorId,
        )
        .catch((err: Error) =>
          this.logger.error(
            `[Grade] Recompute failed after unpublish: ${err.message}`,
          ),
        );
    }
    return { success: true };
  }

  async setGradeVisibility(
    classId: string,
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: SetGradeVisibilityDto,
  ) {
    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    return this.repo.update(assessmentId, { showBreakdown: dto.showBreakdown });
  }

  // ───────── PREVIEW ─────────

  async generatePreview(
    classId: string,
    orgId: string,
    educatorId: string,
    dto: CreateAssessmentDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    await this.creation.assertTypeMatchesScheme(classId, orgId, dto.type);
    const previewId = await this.generation.startPreview(
      classId,
      orgId,
      educatorId,
      dto,
    );
    return { previewId };
  }

  getPreview(previewId: string) {
    return this.generation.getPreview(previewId);
  }

  async confirmPreview(
    previewId: string,
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    const result = this.generation.getPreviewResult(previewId);
    if (!result)
      throw new NotFoundException(
        'Preview not found or expired. Please generate again.',
      );
    const { questions: generated, dto } = result;
    if (!generated?.length)
      throw new NotFoundException('No questions in preview.');
    if (!dto.lessonId) throw new NotFoundException('lessonId is required.');

    const assessment = await this.creation.createAssessmentRecord(
      orgId,
      classId,
      dto,
      dto.gradingMode ?? GradingMode.SYSTEM,
    );
    await this.repo.createQuestions(
      generated.map((q, idx) => ({
        orgId,
        assessmentId: assessment.id,
        type: q.type,
        questionText: q.question,
        correctAnswer:
          q.answer ??
          q.correct_answer ??
          (q.type !== 'essay' && q.type !== 'manual'
            ? `Answer ${q.number}`
            : undefined),
        choices: q.choices?.length ? q.choices : undefined,
        order: q.number ?? idx + 1,
        isManual: q.type === 'manual',
      })),
    );

    this.generation.clearPreview(previewId);
    this.logger.log(
      `[Assessment] ${generated.length} questions confirmed for ${assessment.id}`,
    );
    return { ...assessment, questions: generated };
  }

  async cancelPreview(previewId: string) {
    this.generation.cancelPreview(previewId);
  }

  async onSubmissionFinished(data: {
    orgId: string;
    classId: string;
    studentId: string;
    submittedAt: Date;
  }) {
    this.attendanceService.markPresentFromSubmission(data).catch((err) => {
      this.logger.error(
        `[AttendanceService] Failed to auto-mark present for student ${data.studentId}: ${err}`,
      );
    });
  }
}
