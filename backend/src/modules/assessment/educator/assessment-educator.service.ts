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
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';
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
  SetGradeVisibilityDto,
  GradingMode,
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
    private readonly gradeService: GradeEducatorService,
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

    const gradingMode = dto.gradingMode ?? GradingMode.SYSTEM;
    const isManual = gradingMode === GradingMode.MANUAL;

    // Auto-detect hybrid: if system mode has manual-type sections, upgrade to hybrid
    let effectiveGradingMode = gradingMode;
    const hasManualSections = dto.ranges?.some((r) => r.questionType === 'manual') ?? false;
    if (gradingMode === GradingMode.SYSTEM && hasManualSections) {
      effectiveGradingMode = GradingMode.HYBRID;
    }

    await this.assertTypeMatchesScheme(classId, orgId, dto.type);

    if (!isManual) {
      if (!dto.lessonId) throw new BadRequestException('lessonId is required for system/hybrid assessments.');
      const concept = await this.lessonRepo.findConcept(dto.lessonId);
      if (!concept) throw new BadRequestException('No concept build found for this lesson. Run concept extraction first.');

      if (!dto.ranges?.length) throw new BadRequestException('At least one range is required for system/hybrid assessments.');
      const rangeTotal = dto.ranges.reduce((sum, r) => {
        if (r.questionType === 'manual') return sum + (r.manualMaxScore ?? (r.to - r.from + 1));
        return sum + (r.to - r.from + 1);
      }, 0);
      if (rangeTotal !== dto.totalItems) {
        throw new BadRequestException(`Item ranges total ${rangeTotal} but totalItems is ${dto.totalItems}. They must match.`);
      }
    }

    const assessment = await this.repo.create({
      orgId, classId,
      lessonId: dto.lessonId || undefined,
      termId: dto.termId,
      type: dto.type,
      title: dto.title,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      weekNumber: dto.weekNumber,
      gradingMode: effectiveGradingMode,
      manualMaxScore: dto.manualMaxScore,
      showBreakdown: dto.showBreakdown,
    });

    if (isManual) {
      // Manual mode: create 1 essay question with instructions
      if (dto.manualInstructions?.trim()) {
        await this.repo.createQuestions([{
          orgId,
          assessmentId: assessment.id,
          type: 'manual',
          questionText: dto.manualInstructions.trim(),
          order: 1,
          isManual: true,
        }]);
      }
    } else {
      // System or hybrid mode
      const manualRanges = (dto.ranges ?? []).filter((r) => r.questionType === 'manual');
      const aiRanges = (dto.ranges ?? []).filter((r) => r.questionType !== 'manual');

      // Create manual questions directly — 1 block per section (not per item)
      if (manualRanges.length > 0) {
        const manualQuestions = manualRanges
          .filter((r) => r.manualQuestionText?.trim())
          .map((r, idx) => ({
            orgId,
            assessmentId: assessment.id,
            type: 'manual',
            questionText: r.manualQuestionText!.trim(),
            order: idx + 1,
            isManual: true,
          }));
        if (manualQuestions.length > 0) {
          await this.repo.createQuestions(manualQuestions);
        }
      }

      // Start AI generation for remaining sections
      if (aiRanges.length > 0) {
        this.generationStatuses.set(assessment.id, {
          status: 'generating',
          message: 'Starting generation...',
          chunksTotal: 0,
          chunksDone: 0,
        });

        // Create a filtered DTO that only contains AI ranges for the generation process
        const aiDto = { ...dto, ranges: aiRanges };
        this.generateQuestions(assessment.id, orgId, educatorId, aiDto);
      }
    }

    await this.auditLog.logActivityEvent({
      orgId, actorId: educatorId,
      action: 'assessment_created',
      entityType: 'class', entityId: classId,
      metadata: { assessmentId: assessment.id, type: dto.type, gradingMode: effectiveGradingMode },
    });

    return assessment;
  }

  async findAll(classId: string, orgId: string, educatorId: string, query: QueryAssessmentDto) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const assessments = await this.repo.findAll(classId, orgId, { termId: query.termId, type: query.type, weekNumber: query.weekNumber });
    if (!assessments.length) return [];

    const ids = assessments.map((a) => a.id);

    // Batch-count submitted submissions per assessment
    const submissionCounts = await this.db.submission.groupBy({
      by: ['assessment_id', 'status'],
      where: { assessment_id: { in: ids } },
      _count: { id: true },
    });

    // Get submitted submission IDs mapped to their assessment
    const submittedSubs = await this.db.submission.findMany({
      where: { assessment_id: { in: ids }, status: 'submitted' },
      select: { id: true, assessment_id: true },
    });

    const subToAssessment = new Map(submittedSubs.map((s) => [s.id, s.assessment_id]));

    // Get essay question IDs for each assessment
    const essayQuestions = await this.db.question.findMany({
      where: { assessment_id: { in: ids }, type: 'essay' },
      select: { id: true, assessment_id: true },
    });

    const essayQIds = essayQuestions.map((q) => q.id);

    // Count ungraded essay answers among submitted submissions
    const pendingEssaySubIds = submittedSubs.length && essayQIds.length
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
      if (assId) {
        pendingByAssessment.set(assId, (pendingByAssessment.get(assId) ?? 0) + 1);
      }
    }

    // Build a map: assessment_id -> submitted count
    const submittedMap = new Map<string, number>();
    for (const s of submissionCounts) {
      if (s.status === 'submitted') {
        submittedMap.set(s.assessment_id, s._count.id);
      }
    }

    return assessments.map((a) => ({
      ...a,
      submittedCount: submittedMap.get(a.id) ?? 0,
      pendingEssayCount: pendingByAssessment.get(a.id) ?? 0,
    }));
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
      showBreakdown: dto.showBreakdown,
      gradingMode: dto.gradingMode,
      manualMaxScore: dto.manualMaxScore,
      weekNumber: dto.weekNumber,
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

    // Async grade recompute after deletion
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(assessment.class_id, assessment.term_id, orgId, educatorId)
        .catch((err: Error) =>
          this.logger.error(`[Grade] Recompute failed after delete ${id}: ${err.message}`),
        );
    }

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

    // Get all enrolled students with their profile info
    const enrollments = await this.db.enrollment.findMany({
      where: { class_id: assessment.class_id, org_id: orgId, status: { not: 'removed' } },
      select: { student_id: true },
    });

    const studentIds = enrollments.map((e) => e.student_id);
    if (!studentIds.length) return [];

    const profiles = await this.db.profile.findMany({
      where: { account_id: { in: studentIds } },
      select: {
        account_id: true,
        full_name: true,
        account: { select: { email: true } },
      },
    });

    const profileMap = new Map(profiles.map((p) => [p.account_id, { name: p.full_name, email: p.account?.email ?? null }]));

    // Get all submissions for this assessment
    const submissions = await this.repo.findSubmissions(assessmentId, orgId);

    // For each submission, load answers (limit to first N chars for list view)
    const submissionIds = submissions.map((s) => s.id);
    const answers = submissionIds.length
      ? await this.db.submissionAnswer.findMany({
          where: { submission_id: { in: submissionIds } },
          select: { id: true, submission_id: true, question_id: true, answer: true, is_correct: true },
        })
      : [];

    const answerMap = new Map<string, typeof answers>();
    for (const a of answers) {
      const list = answerMap.get(a.submission_id) ?? [];
      list.push(a);
      answerMap.set(a.submission_id, list);
    }

    const subMap = new Map(submissions.map((s) => [s.student_id, s]));

    // Build full roster: every enrolled student gets a row
    return studentIds.map((studentId) => {
      const profile = profileMap.get(studentId);
      const sub = subMap.get(studentId);
      const subAnswers = sub ? answerMap.get(sub.id) ?? [] : [];

      const isNotStarted = !sub;
      return {
        id: sub?.id ?? `not_started_${studentId}`,
        assessment_id: assessmentId,
        student_id: studentId,
        student_name: profile?.name ?? 'Unknown',
        student_code: profile?.email ?? '',
        status: isNotStarted ? 'not_started' : (sub.status as string),
        score: sub?.score ?? null,
        manual_score: sub?.manual_score ?? null,
        total_points: assessment.total_items,
        is_published: assessment.is_published,
        essay_graded: false, // simplified; could check if all essay answers are graded
        answers: subAnswers.map((a) => ({
          id: a.id,
          questionId: a.question_id,
          answer: a.answer,
          isCorrect: a.is_correct,
        })),
        started_at: null, // no creation timestamp on submission
        submitted_at: sub?.submitted_at ?? null,
        updated_at: sub?.submitted_at ?? null,
        system_section_score: sub?.system_section_score ?? null,
        manual_section_score: sub?.manual_section_score ?? null,
        is_missed: sub?.is_missed ?? false,
        is_exempted: sub?.is_exempted ?? false,
      };
    });
  }

  async updateSubmissionStatus(assessmentId: string, submissionId: string, orgId: string, educatorId: string, dto: UpdateSubmissionStatusDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    let submission = await this.repo.findSubmissionById(submissionId);

    // If no submission found (e.g. student was never assigned), create one on the fly
    if (!submission || submission.assessment_id !== assessmentId) {
      const notStartedPrefix = 'not_started_';
      let studentId: string | null = null;

      if (submissionId.startsWith(notStartedPrefix)) {
        studentId = submissionId.slice(notStartedPrefix.length);
      }

      if (!studentId) throw new NotFoundException('Submission not found.');

      const enrollment = await this.db.enrollment.findFirst({
        where: { class_id: assessment.class_id, org_id: orgId, student_id: studentId, status: { not: 'removed' } },
      });
      if (!enrollment) throw new NotFoundException('Student not enrolled in this class.');

      submission = await this.db.submission.create({
        data: {
          org_id: orgId,
          assessment_id: assessmentId,
          student_id: studentId,
          status: 'draft',
        },
      });
    }

    if (dto.status === 'custom' && dto.manualScore === undefined) throw new BadRequestException('manualScore is required for custom status.');

    const updateData: any = { status: dto.status, manualScore: dto.manualScore };

    if (dto.status === 'exempted') {
      updateData.isExempted = true;
      updateData.score = 0;
    }

    if (dto.status === 'missed') {
      updateData.status = 'custom';
      updateData.isMissed = true;
      updateData.score = 0;
    }

    const updated = await this.repo.updateSubmissionStatus(submission.id, updateData);

    // Async grade recompute after status change
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(assessment.class_id, assessment.term_id, orgId, educatorId)
        .catch((err: Error) =>
          this.logger.error(`[Grade] Recompute failed after status change ${assessmentId}: ${err.message}`),
        );
    }

    return updated;
  }

  async gradeEssay(assessmentId: string, submissionId: string, orgId: string, educatorId: string, dto: GradeEssayDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);

    const submission = await this.repo.findSubmissionById(submissionId);
    if (!submission || submission.assessment_id !== assessmentId) throw new NotFoundException('Submission not found.');

    return this.repo.gradeEssay(submissionId, dto.score, dto.score);
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

    // Register not_started submissions for all enrolled students
    await this.gradeService.registerAssessmentForAllStudents(assessmentId, assessment.class_id, orgId);

    // Async grade recompute after publish
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(assessment.class_id, assessment.term_id, orgId, educatorId)
        .catch((err: Error) =>
          this.logger.error(`[Grade] Recompute failed after publish ${assessmentId}: ${err.message}`),
        );
    }

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

    // Async grade recompute after unpublish
    if (assessment.term_id) {
      this.gradeService
        .computeGrades(assessment.class_id, assessment.term_id, orgId, educatorId)
        .catch((err: Error) =>
          this.logger.error(`[Grade] Recompute failed after unpublish ${assessmentId}: ${err.message}`),
        );
    }

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
        status: 'draft',
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

  async setGradeVisibility(classId: string, assessmentId: string, orgId: string, educatorId: string, dto: SetGradeVisibilityDto) {
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    await this.assertEducatorOwnsClass(assessment.class_id, orgId, educatorId);
    return this.repo.update(assessmentId, { showBreakdown: dto.showBreakdown });
  }

  async onSubmissionFinished(data: { orgId: string; classId: string; studentId: string; submittedAt: Date }) {
    this.attendanceService.markPresentFromSubmission(data).catch((err) => {
      console.error(`[AttendanceService] Failed to auto-mark present for student ${data.studentId}:`, err);
    });
  }

  // ───────── VALIDATION ─────────

  private async assertTypeMatchesScheme(classId: string, orgId: string, type: string) {
    const scheme = await this.db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
      include: { components: { select: { type: true } } },
    });
    if (!scheme) return; // no scheme = no restriction
    const validTypes = scheme.components.map((c) => c.type);
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Assessment type "${type}" is not in the class's grading scheme. Allowed: ${validTypes.join(', ')}`,
      );
    }
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
    await this.assertTypeMatchesScheme(classId, orgId, dto.type);
    if (!dto.lessonId) throw new BadRequestException('lessonId is required.');
    const concept = await this.lessonRepo.findConcept(dto.lessonId);
    if (!concept) throw new BadRequestException('No concept build found.');
    if (!dto.ranges?.length) throw new BadRequestException('At least one range is required.');
    const rangeTotal = dto.ranges.reduce((sum, r) => {
      if (r.questionType === 'manual' && r.manualMaxScore != null) return sum + r.manualMaxScore;
      return sum + (r.to - r.from + 1);
    }, 0);
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
    if (!dto.lessonId) throw new BadRequestException('lessonId is required.');

    const assessment = await this.repo.create({
      orgId, classId,
      lessonId: dto.lessonId,
      termId: dto.termId,
      type: dto.type,
      title: dto.title,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      weekNumber: dto.weekNumber,
      gradingMode: dto.gradingMode,
      manualMaxScore: dto.manualMaxScore,
      showBreakdown: dto.showBreakdown,
    });

    const questions = generated.map((q, idx) => ({
      orgId,
      assessmentId: assessment.id,
      type: q.type,
      questionText: q.question,
      correctAnswer: q.answer ?? q.correct_answer ?? (q.type !== 'essay' && q.type !== 'manual' ? `Answer ${q.number}` : undefined),
      choices: q.choices?.length ? q.choices : undefined,
      order: q.number ?? idx + 1,
      isManual: q.type === 'manual',
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
      if (!dto.lessonId) throw new BadRequestException('lessonId is required.');

      const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
      if (!lesson) throw new NotFoundException('Lesson not found');
      const lessonDetail = lesson.detail ?? '';

      // Separate manual ranges — they don't need AI generation
      const manualRanges = (dto.ranges ?? []).filter((r) => r.questionType === 'manual');
      const aiRanges = (dto.ranges ?? []).filter((r) => r.questionType !== 'manual');

      // Build manual questions — 1 block per section (not per item)
      const manualQuestions: GeneratedQuestion[] = [];
      for (const r of manualRanges) {
        if (r.manualQuestionText?.trim()) {
          manualQuestions.push({
            number: manualQuestions.length + 1,
            type: 'manual',
            section: '',
            question: r.manualQuestionText.trim(),
          });
        }
      }

      const blueprints = aiRanges.map((r) => ({
        type: r.questionType as QuestionBlueprint['type'],
        sections: r.conceptSections ?? [],
        numbers: `${r.from}-${r.to}`,
        count: r.to - r.from + 1,
      }));

      let aiQuestions: GeneratedQuestion[] = [];

      if (blueprints.length > 0) {
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
          aiQuestions = generated;
        } finally {
          clearInterval(cancelWatch);
        }
      }

      const allQuestions = [...aiQuestions, ...manualQuestions];

      if (!allQuestions.length) throw new Error('No questions to preview');

      this.previewResults.set(previewId, { questions: allQuestions, orgId, educatorId, dto, classId });
      setStatus({
        status: 'completed',
        message: `Generated ${allQuestions.length} questions — review and confirm`,
      });

      this.logger.log(`[Preview] ${allQuestions.length} questions ready for review (${previewId}) (${aiQuestions.length} AI, ${manualQuestions.length} manual)`);
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
      if (!dto.lessonId) throw new BadRequestException('lessonId is required.');
      // 1. Fetch lesson detail for AI context
      const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
      if (!lesson) throw new NotFoundException('Lesson not found');
      const lessonDetail = lesson.detail ?? '';
      const conceptRecord = await this.lessonRepo.findConcept(dto.lessonId);

      const blueprints = (dto.ranges ?? []).map((r) => ({
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