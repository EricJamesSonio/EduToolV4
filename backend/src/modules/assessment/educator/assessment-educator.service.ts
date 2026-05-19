// @/modules/assessment/educator/assessment-educator.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AssessmentRepository } from '../core/assessment-core.repository';
import { AssessmentCoreService } from '../core/assessment-core.service';
import { DatabaseService } from '@/core/database/database.provider';
import { LessonRepository } from '@/modules/lesson/lesson.repository';
import { ClassRepository } from '@/modules/class/class.repository';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { AttendanceService } from '@/modules/attendance/attendance.service';
import { AiService, QuestionBlueprint, GeneratedQuestion, GenerationProgress, ConceptBuild } from '@/core/ai/ai.service';
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
} from '../dto/assessment.dto';

@Injectable()
export class AssessmentEducatorService {
  private readonly logger = new Logger(AssessmentEducatorService.name);

  // In-memory generation status tracker (lost on restart — acceptable)
  private generationStatuses = new Map<string, GenerationProgress>();

  constructor(
    private readonly repo: AssessmentRepository,
    private readonly core: AssessmentCoreService,
    private readonly db: DatabaseService,
    private readonly lessonRepo: LessonRepository,
    private readonly classRepo: ClassRepository,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly attendanceService: AttendanceService,
    private readonly aiService: AiService,
  ) {}

  getGenerationStatus(assessmentId: string): GenerationProgress | null {
    return this.generationStatuses.get(assessmentId) ?? null;
  }

  // ───────── GUARDS ─────────

  private async assertEducatorOwnsClass(classId: string, orgId: string, educatorId: string) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) throw new ForbiddenException('You do not own this class.');
    return cls;
  }

  private async assertAssessmentEditable(assessmentId: string, orgId: string) {
    const assessment = await this.repo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');
    if (assessment.release_date && new Date() >= new Date(assessment.release_date)) {
      throw new ForbiddenException('Assessment has been released — questions are locked.');
    }
    return assessment;
  }

  // ───────── USE CASES ─────────

  async create(classId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const concept = await this.lessonRepo.findConcept(dto.lessonId);
    if (!concept) throw new BadRequestException('No concept build found for this lesson. Run concept extraction first.');

    const rangeTotal = dto.ranges.reduce((sum, r) => sum + (r.to - r.from + 1), 0);
    if (rangeTotal !== dto.totalItems) {
      throw new BadRequestException(`Item ranges total ${rangeTotal} but totalItems is ${dto.totalItems}. They must match.`);
    }

    const assessment = await this.repo.create({
      orgId, classId,
      lessonId: dto.lessonId,
      termId: dto.termId,
      type: dto.type,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
    });

    this.generationStatuses.set(assessment.id, {
      status: 'generating',
      message: 'Starting generation...',
      chunksTotal: 0,
      chunksDone: 0,
    });

    // Fire generation asynchronously — frontend polls status endpoint
    this.generateQuestions(assessment.id, orgId, educatorId, dto);

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'assessment_created',
      entityType: 'class', entityId: classId,
      metadata: { assessmentId: assessment.id, type: dto.type },
    });

    return assessment;
  }

  async findAll(classId: string, orgId: string, educatorId: string, query: QueryAssessmentDto) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    return this.repo.findAll(classId, orgId, { termId: query.termId, type: query.type });
  }

  async findOne(id: string, orgId: string, educatorId: string) {
    const assessment = await this.core.findAssessmentOrThrow(id, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    const questions = await this.core.getQuestions(id);
    const genStatus = this.generationStatuses.get(id) ?? null;
    return { ...assessment, questions, generationStatus: genStatus?.status ?? 'completed' };
  }

  async update(id: string, orgId: string, educatorId: string, dto: UpdateAssessmentDto) {
    const assessment = await this.core.findAssessmentOrThrow(id, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const updated = await this.repo.update(id, {
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      type: dto.type,
    });

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'assessment_edited',
      entityType: 'class', entityId: assessment.class_id,
      metadata: { assessmentId: id },
    });

    return updated;
  }

  async delete(id: string, orgId: string, educatorId: string) {
    const assessment = await this.core.findAssessmentOrThrow(id, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    await this.repo.softDelete(id);

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'assessment_deleted',
      entityType: 'class', entityId: assessment.class_id,
      metadata: { assessmentId: id },
    });

    return { success: true };
  }

  async updateQuestion(assessmentId: string, questionId: string, orgId: string, educatorId: string, dto: UpdateQuestionDto) {
    const assessment = await this.assertAssessmentEditable(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const question = await this.repo.findQuestionById(questionId);
    if (!question || question.assessment_id !== assessmentId) throw new NotFoundException('Question not found.');

    return this.repo.updateQuestion(questionId, {
      questionText: dto.questionText,
      correctAnswer: dto.correctAnswer,
    });
  }

  async getSubmissions(assessmentId: string, orgId: string, educatorId: string) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    return this.repo.findSubmissions(assessmentId, orgId);
  }

  async updateSubmissionStatus(assessmentId: string, submissionId: string, orgId: string, educatorId: string, dto: UpdateSubmissionStatusDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const submission = await this.repo.findSubmissionById(submissionId);
    if (!submission || submission.assessment_id !== assessmentId) throw new NotFoundException('Submission not found.');
    if (dto.status === 'custom' && dto.manualScore === undefined) throw new BadRequestException('manualScore is required for custom status.');

    return this.repo.updateSubmissionStatus(submissionId, { status: dto.status, manualScore: dto.manualScore });
  }

  async gradeEssay(assessmentId: string, submissionId: string, orgId: string, educatorId: string, dto: GradeEssayDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const submission = await this.repo.findSubmissionById(submissionId);
    if (!submission || submission.assessment_id !== assessmentId) throw new NotFoundException('Submission not found.');

    return this.repo.gradeEssay(submissionId, dto.score);
  }

  async publishScores(assessmentId: string, orgId: string, educatorId: string, dto: PublishScoresDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    await this.repo.update(assessmentId, { isPublished: true });

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'score_published',
      entityType: 'class', entityId: assessment.class_id,
      metadata: { assessmentId, studentIds: dto.studentIds ?? 'all' },
    });

    return { success: true };
  }

  async unpublishScores(assessmentId: string, orgId: string, educatorId: string) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    await this.repo.update(assessmentId, { isPublished: false });

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'score_unpublished',
      entityType: 'class', entityId: assessment.class_id,
      metadata: { assessmentId },
    });

    return { success: true };
  }

  async reopen(assessmentId: string, orgId: string, educatorId: string, dto: ReopenAssessmentDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const reopenedUntil = new Date(dto.reopenedUntil);

    for (const studentId of dto.studentIds) {
      const existing = await this.repo.findSubmissionByStudent(assessmentId, studentId);
      if (existing) {
        // Reset existing submission: delete answers, set status to not_started, set reopened_until
        await this.db.submissionAnswer.deleteMany({
          where: { submission_id: existing.id },
        });
        await this.db.submission.update({
          where: { id: existing.id },
          data: {
            status: 'draft',
            score: null,
            manual_score: null,
            submitted_at: null,
            reopened_until: reopenedUntil,
          },
        });
      } else {
        // Create new submission with reopened_until
        await this.db.submission.create({
          data: {
            org_id: orgId,
            assessment_id: assessmentId,
            student_id: studentId,
            status: 'draft',
            reopened_until: reopenedUntil,
          },
        });
      }
    }

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'assessment_reopened',
      entityType: 'assessment', entityId: assessmentId,
      metadata: { assessmentId, studentIds: dto.studentIds, reopenedUntil: dto.reopenedUntil },
    });

    return { success: true, reopened: dto.studentIds.length };
  }

  async assignStudents(assessmentId: string, orgId: string, educatorId: string, dto: AssignStudentsDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    // Create a submission for each student (if none exists yet) — encourages them to start
    for (const studentId of dto.studentIds) {
      await this.repo.upsertSubmission({
        orgId,
        assessmentId,
        studentId,
        status: 'not_started',
      }).catch(() => {});
    }

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'students_assigned_to_assessment',
      entityType: 'assessment', entityId: assessmentId,
      metadata: { assessmentId, studentIds: dto.studentIds },
    });

    return { success: true, assigned: dto.studentIds.length };
  }

  async onSubmissionFinished(data: { orgId: string; classId: string; studentId: string; submittedAt: Date }) {
    this.attendanceService.markPresentFromSubmission(data).catch((err) => {
      console.error(`[AttendanceService] Failed to auto-mark present for student ${data.studentId}:`, err);
    });
  }

  // ───────── PRIVATE ─────────

  // ───────── PREVIEW FLOW (no DB save until confirmed) ─────────

  private previewResults = new Map<string, {
    questions: GeneratedQuestion[];
    orgId: string;
    educatorId: string;
    dto: CreateAssessmentDto;
    classId: string;
  }>();

  async generatePreview(classId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto): Promise<{ previewId: string }> {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const concept = await this.lessonRepo.findConcept(dto.lessonId);
    if (!concept) throw new BadRequestException('No concept build found.');
    const rangeTotal = dto.ranges.reduce((sum, r) => sum + (r.to - r.from + 1), 0);
    if (rangeTotal !== dto.totalItems) throw new BadRequestException('Range total mismatch.');

    const previewId = crypto.randomUUID();
    this.generationStatuses.set(previewId, { status: 'generating', message: 'Starting...', chunksTotal: 0, chunksDone: 0 });

    this.generatePreviewQuestions(previewId, classId, orgId, educatorId, dto);

    return { previewId };
  }

  async getPreview(previewId: string): Promise<{
    status: GenerationProgress['status'];
    message: string;
    chunksTotal: number;
    chunksDone: number;
    questions?: GeneratedQuestion[];
  }> {
    const gen = this.generationStatuses.get(previewId);
    if (!gen) return { status: 'failed', message: 'Preview not found or expired', chunksTotal: 0, chunksDone: 0 };
    const result = this.previewResults.get(previewId);
    return {
      status: gen.status,
      message: gen.message,
      chunksTotal: gen.chunksTotal,
      chunksDone: gen.chunksDone,
      questions: result?.questions,
    };
  }

  async confirmPreview(previewId: string, classId: string, orgId: string, educatorId: string): Promise<any> {
    const result = this.previewResults.get(previewId);
    if (!result) throw new BadRequestException('Preview not found or expired. Please generate again.');

    const { questions: generated, dto } = result;
    if (!generated?.length) throw new BadRequestException('No questions in preview.');

    const assessment = await this.repo.create({
      orgId, classId,
      lessonId: dto.lessonId,
      termId: dto.termId,
      type: dto.type,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
    });

    const questions = generated.map((q, idx) => ({
      orgId,
      assessmentId: assessment.id,
      type: q.type,
      questionText: q.question,
      correctAnswer: q.answer ?? q.correct_answer ?? (q.type !== 'essay' ? `Answer ${q.number}` : undefined),
      choices: q.choices?.length ? q.choices : undefined,
      order: q.number ?? idx + 1,
    }));

    await this.repo.createQuestions(questions);

    this.generationStatuses.delete(previewId);
    this.previewResults.delete(previewId);

    this.logger.log(`[Assessment] ${questions.length} questions confirmed for ${assessment.id}`);
    return { ...assessment, questions };
  }

  async cancelPreview(previewId: string): Promise<void> {
    this.cancellationFlags.set(previewId, true);
    this.generationStatuses.delete(previewId);
    this.previewResults.delete(previewId);
  }

  private cancellationFlags = new Map<string, boolean>();

  private async generatePreviewQuestions(previewId: string, classId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
    const setStatus = (update: Partial<GenerationProgress>) => {
      const current = this.generationStatuses.get(previewId) ?? {
        status: 'generating', message: '', chunksTotal: 0, chunksDone: 0,
      };
      this.generationStatuses.set(previewId, { ...current, ...update });
    };

    try {
      if (this.cancellationFlags.get(previewId)) return;

      const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
      if (!lesson) throw new NotFoundException('Lesson not found');
      const lessonDetail = lesson.detail ?? '';

      const blueprints = dto.ranges.map((r) => ({
        type: r.questionType as QuestionBlueprint['type'],
        sections: r.conceptSections,
        numbers: `${r.from}-${r.to}`,
        count: r.to - r.from + 1,
      }));

      const ctrl = new AbortController();
      const cancelWatch = setInterval(() => {
        if (this.cancellationFlags.get(previewId)) ctrl.abort();
      }, 500);

      try {
        const generated = await this.aiService.generateQuestions(
          lessonDetail, blueprints,
          (progress) => setStatus(progress),
          ctrl.signal,
        );

        if (this.cancellationFlags.get(previewId)) return;
        if (!generated?.length) throw new Error('AI returned no questions');

        this.previewResults.set(previewId, { questions: generated, orgId, educatorId, dto, classId });
        setStatus({ status: 'completed', message: `Generated ${generated.length} questions — review and confirm` });

        this.logger.log(`[Preview] ${generated.length} questions ready for review (${previewId})`);
      } finally {
        clearInterval(cancelWatch);
      }
    } catch (err) {
      const isCancelled = String(err).includes('cancelled') || String(err).includes('abort');
      if (isCancelled) {
        this.logger.log(`[Preview] Generation cancelled (${previewId})`);
        this.generationStatuses.delete(previewId);
        this.previewResults.delete(previewId);
      } else {
        this.logger.error(`[Preview] Generation failed: ${err}`);
        setStatus({ status: 'failed', message: `Generation failed: ${err}`, error: String(err) });
      }
    } finally {
      this.cancellationFlags.delete(previewId);
    }
  }

async getPreview(previewId: string): Promise<{
  status: GenerationProgress['status'];
  message: string;
  chunksTotal: number;
  chunksDone: number;
  questions?: GeneratedQuestion[];
}> {
  const gen = this.generationStatuses.get(previewId);
  if (!gen) return { status: 'failed', message: 'Preview not found or expired', chunksTotal: 0, chunksDone: 0 };
  const result = this.previewResults.get(previewId);
  return {
    status: gen.status,
    message: gen.message,
    chunksTotal: gen.chunksTotal,
    chunksDone: gen.chunksDone,
    questions: result?.questions,
  };
}

async confirmPreview(previewId: string, classId: string, orgId: string, educatorId: string): Promise<any> {
  const result = this.previewResults.get(previewId);
  if (!result) throw new BadRequestException('Preview not found or expired. Please generate again.');

  const { questions: generated, dto } = result;
  if (!generated?.length) throw new BadRequestException('No questions in preview.');

  // Create assessment + save questions atomically
    const assessment = await this.repo.create({
      orgId, classId,
      lessonId: dto.lessonId,
      termId: dto.termId,
      type: dto.type,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
    });

  const questions = generated.map((q, idx) => ({
    orgId,
    assessmentId: assessment.id,
    type: q.type,
    questionText: q.question,
    correctAnswer: q.answer ?? q.correct_answer ?? (q.type !== 'essay' ? `Answer ${q.number}` : undefined),
    choices: q.choices?.length ? q.choices : undefined,
    order: q.number ?? idx + 1,
  }));

  await this.repo.createQuestions(questions);

  // Clean up preview data
  this.generationStatuses.delete(previewId);
  this.previewResults.delete(previewId);

  this.logger.log(`[Assessment] ${questions.length} questions confirmed for ${assessment.id}`);
  return { ...assessment, questions };
}

async cancelPreview(previewId: string): Promise<void> {
  this.cancellationFlags.set(previewId, true);
  this.generationStatuses.delete(previewId);
  this.previewResults.delete(previewId);
}

private cancellationFlags = new Map<string, boolean>();

private async generatePreviewQuestions(previewId: string, classId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
  const setStatus = (update: Partial<GenerationProgress>) => {
    const current = this.generationStatuses.get(previewId) ?? {
      status: 'generating', message: '', chunksTotal: 0, chunksDone: 0,
    };
    this.generationStatuses.set(previewId, { ...current, ...update });
  };

  try {
    if (this.cancellationFlags.get(previewId)) return;

    const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    const lessonDetail = lesson.detail ?? '';

    // Use concept build to compress lesson sent to AI
    const conceptRecord = await this.lessonRepo.findConcept(dto.lessonId);

    const blueprints = dto.ranges.map((r) => ({
      type: r.questionType as QuestionBlueprint['type'],
      sections: r.conceptSections,
      numbers: `${r.from}-${r.to}`,
      count: r.to - r.from + 1,
    }));

    const ctrl = new AbortController();
    const cancelWatch = setInterval(() => {
      if (this.cancellationFlags.get(previewId)) ctrl.abort();
    }, 500);

    try {
      const generated = await this.aiService.generateQuestions(
        lessonDetail, blueprints,
        (progress) => setStatus(progress),
        ctrl.signal,
        conceptRecord?.content as ConceptBuild ?? undefined,
      );

      if (this.cancellationFlags.get(previewId)) return;

      if (!generated?.length) throw new Error('AI returned no questions');

      this.previewResults.set(previewId, { questions: generated, orgId, educatorId, dto, classId });
      setStatus({
        status: 'completed',
        message: `Generated ${generated.length} questions — review and confirm`,
      });

      this.logger.log(`[Preview] ${generated.length} questions ready for review (${previewId})`);
    } finally {
      clearInterval(cancelWatch);
    }
  } catch (err) {
    const isCancelled = String(err).includes('cancelled') || String(err).includes('abort');
    if (isCancelled) {
      this.logger.log(`[Preview] Generation cancelled (${previewId})`);
      this.generationStatuses.delete(previewId);
      this.previewResults.delete(previewId);
    } else {
      this.logger.error(`[Preview] Generation failed: ${err}`);
      setStatus({
        status: 'failed',
        message: `Generation failed: ${err}`,
        error: String(err),
      });
    }
  } finally {
    this.cancellationFlags.delete(previewId);
  }
}

 private async generateQuestions(assessmentId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
    const setStatus = (update: Partial<GenerationProgress>) => {
      const current = this.generationStatuses.get(assessmentId) ?? {
        status: 'generating', message: '', chunksTotal: 0, chunksDone: 0,
      };
      this.generationStatuses.set(assessmentId, { ...current, ...update });
    };

    try {
      // 1. Fetch lesson detail for AI context
      const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
      if (!lesson) throw new NotFoundException('Lesson not found');
      const lessonDetail = lesson.detail ?? '';
      const conceptRecord = await this.lessonRepo.findConcept(dto.lessonId);

      const blueprints = dto.ranges.map((r) => ({
        type: r.questionType as QuestionBlueprint['type'],
        sections: r.conceptSections,
        numbers: `${r.from}-${r.to}`,
        count: r.to - r.from + 1,
      }));

      const generated = await this.aiService.generateQuestions(
        lessonDetail,
        blueprints,
        (progress) => setStatus(progress),
        undefined,
        conceptRecord?.content as ConceptBuild ?? undefined,
      );

      if (!generated?.length) {
        throw new Error('AI returned no questions.');
      }

      // 4. Batch-save all questions atomically
      const questions = generated.map((q, idx) => ({
        orgId,
        assessmentId,
        type: q.type,
        questionText: q.question,
        correctAnswer: q.answer ?? q.correct_answer ?? (q.type !== 'essay' ? `Answer ${q.number}` : undefined),
        choices: q.choices?.length ? q.choices : undefined,
        order: q.number ?? idx + 1,
      }));

      await this.repo.createQuestions(questions);

      this.logger.log(`[Assessment] ${questions.length} questions generated for ${assessmentId}`);
      setStatus({ status: 'completed', message: `Generated ${questions.length} questions` });

      await this.notificationService.createNotification({
        orgId, accountId: educatorId,
        type: 'assessment_generation_completed',
        payload: { assessmentId },
      });

      await this.auditLog.logActivityEvent({
        orgId, actorId: educatorId,
        action: 'assessment_questions_generated',
        entityType: 'assessment', entityId: assessmentId,
        metadata: { assessmentId, questionsGenerated: questions.length },
      });
    } catch (err) {
      this.logger.error(`[Assessment] AI generation failed: ${err}`);
      setStatus({
        status: 'failed',
        message: `Generation failed: ${err}`,
        error: String(err),
      });

      // Delete assessment to avoid half-baked state
      await this.repo.softDelete(assessmentId).catch(() => {});
    }
  }
}