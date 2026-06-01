import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssessmentRepository } from '../core/assessment-core.repository';
import { LessonRepository } from '@/modules/lesson/lesson.repository';
import { AiService, QuestionBlueprint, GeneratedQuestion, GenerationProgress, ConceptBuild } from '@/core/ai/ai.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { CreateAssessmentDto } from '../dto/assessment.dto';

@Injectable()
export class AssessmentGenerationHelper {
  private readonly logger = new Logger(AssessmentGenerationHelper.name);

  readonly generationStatuses = new Map<string, GenerationProgress>();
  readonly previewResults = new Map<string, {
    questions: GeneratedQuestion[];
    orgId: string;
    educatorId: string;
    dto: CreateAssessmentDto;
    classId: string;
  }>();
  private readonly cancellationFlags = new Map<string, boolean>();

  constructor(
    private readonly repo: AssessmentRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    private readonly auditLog: AuditLogService,
  ) {}

  getGenerationStatus(assessmentId: string): GenerationProgress | null {
    return this.generationStatuses.get(assessmentId) ?? null;
  }

  async startGeneration(assessmentId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
    this.generationStatuses.set(assessmentId, { status: 'generating', message: 'Starting generation...', chunksTotal: 0, chunksDone: 0 });
    this.generateQuestions(assessmentId, orgId, educatorId, dto);
  }

  async startPreview(classId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto): Promise<string> {
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
    return previewId;
  }

  getPreview(previewId: string) {
    const gen = this.generationStatuses.get(previewId);
    if (!gen) return { status: 'failed' as const, message: 'Preview not found or expired', chunksTotal: 0, chunksDone: 0 };
    const result = this.previewResults.get(previewId);
    return { status: gen.status, message: gen.message, chunksTotal: gen.chunksTotal, chunksDone: gen.chunksDone, questions: result?.questions };
  }

  getPreviewResult(previewId: string) {
    return this.previewResults.get(previewId) ?? null;
  }

  cancelPreview(previewId: string) {
    this.cancellationFlags.set(previewId, true);
    this.generationStatuses.delete(previewId);
    this.previewResults.delete(previewId);
  }

  clearPreview(previewId: string) {
    this.generationStatuses.delete(previewId);
    this.previewResults.delete(previewId);
  }

  private setStatus(id: string, update: Partial<GenerationProgress>) {
    const current = this.generationStatuses.get(id) ?? { status: 'generating', message: '', chunksTotal: 0, chunksDone: 0 };
    this.generationStatuses.set(id, { ...current, ...update });
  }

  private async generateQuestions(assessmentId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
    try {
      if (!dto.lessonId) throw new BadRequestException('lessonId is required.');
      const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
      if (!lesson) throw new NotFoundException('Lesson not found');
      const conceptRecord = await this.lessonRepo.findConcept(dto.lessonId);

      const blueprints = (dto.ranges ?? []).map((r) => ({
        type: r.questionType as QuestionBlueprint['type'],
        sections: r.conceptSections,
        numbers: `${r.from}-${r.to}`,
        count: r.to - r.from + 1,
      }));

      const generated = await this.aiService.generateQuestions(
        lesson.detail ?? '', blueprints,
        (progress) => this.setStatus(assessmentId, progress),
        undefined,
        conceptRecord?.content as ConceptBuild ?? undefined,
      );

      if (!generated?.length) throw new Error('AI returned no questions.');

      await this.repo.createQuestions(generated.map((q, idx) => ({
        orgId, assessmentId,
        type: q.type,
        questionText: q.question,
        correctAnswer: q.answer ?? q.correct_answer ?? (q.type !== 'essay' ? `Answer ${q.number}` : undefined),
        choices: q.choices?.length ? q.choices : undefined,
        order: q.number ?? idx + 1,
      })));

      this.logger.log(`[Assessment] ${generated.length} questions generated for ${assessmentId}`);
      this.setStatus(assessmentId, { status: 'completed', message: `Generated ${generated.length} questions` });

      await this.notificationService.createNotification({ orgId, accountId: educatorId, type: 'assessment_generation_completed', payload: { assessmentId } });
      await this.auditLog.logActivityEvent({ orgId, actorId: educatorId, action: 'assessment_questions_generated', entityType: 'assessment', entityId: assessmentId, metadata: { assessmentId, questionsGenerated: generated.length } });
    } catch (err) {
      this.logger.error(`[Assessment] AI generation failed: ${err}`);
      this.setStatus(assessmentId, { status: 'failed', message: `Generation failed: ${err}`, error: String(err) });
      await this.repo.softDelete(assessmentId).catch(() => {});
    }
  }

  private async generatePreviewQuestions(previewId: string, classId: string, orgId: string, educatorId: string, dto: CreateAssessmentDto) {
    try {
      if (this.cancellationFlags.get(previewId)) return;
      if (!dto.lessonId) throw new BadRequestException('lessonId is required.');
      const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
      if (!lesson) throw new NotFoundException('Lesson not found');

      const manualRanges = (dto.ranges ?? []).filter((r) => r.questionType === 'manual');
      const aiRanges = (dto.ranges ?? []).filter((r) => r.questionType !== 'manual');

      const manualQuestions: GeneratedQuestion[] = manualRanges
        .filter((r) => r.manualQuestionText?.trim())
        .map((r, i) => ({ number: i + 1, type: 'manual' as const, section: '', question: r.manualQuestionText!.trim() }));

      let aiQuestions: GeneratedQuestion[] = [];
      if (aiRanges.length > 0) {
        const ctrl = new AbortController();
        const cancelWatch = setInterval(() => { if (this.cancellationFlags.get(previewId)) ctrl.abort(); }, 500);
        try {
          const generated = await this.aiService.generateQuestions(
            lesson.detail ?? '',
            aiRanges.map((r) => ({ type: r.questionType as QuestionBlueprint['type'], sections: r.conceptSections ?? [], numbers: `${r.from}-${r.to}`, count: r.to - r.from + 1 })),
            (progress) => this.setStatus(previewId, progress),
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
      this.setStatus(previewId, { status: 'completed', message: `Generated ${allQuestions.length} questions — review and confirm` });
      this.logger.log(`[Preview] ${allQuestions.length} questions ready (${previewId})`);
    } catch (err) {
      const isCancelled = String(err).includes('cancelled') || String(err).includes('abort');
      if (isCancelled) {
        this.generationStatuses.delete(previewId);
        this.previewResults.delete(previewId);
      } else {
        this.logger.error(`[Preview] Generation failed: ${err}`);
        this.setStatus(previewId, { status: 'failed', message: `Generation failed: ${err}`, error: String(err) });
      }
    } finally {
      this.cancellationFlags.delete(previewId);
    }
  }
}