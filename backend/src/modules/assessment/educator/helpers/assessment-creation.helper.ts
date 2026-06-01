import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssessmentRepository } from '../../core/assessment-core.repository';
import { LessonRepository } from '@/modules/lesson/lesson.repository';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateAssessmentDto, GradingMode } from '../../dto/assessment.dto';

@Injectable()
export class AssessmentCreationHelper {
  constructor(
    private readonly repo: AssessmentRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly db: DatabaseService,
  ) {}

  async assertTypeMatchesScheme(classId: string, orgId: string, type: string) {
    const scheme = await this.db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
      include: { components: { select: { type: true } } },
    });
    if (!scheme) return;
    const validTypes = scheme.components.map((c) => c.type);
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Assessment type "${type}" is not in the class's grading scheme. Allowed: ${validTypes.join(', ')}`,
      );
    }
  }

  resolveGradingMode(dto: CreateAssessmentDto): GradingMode {
    const base = dto.gradingMode ?? GradingMode.SYSTEM;
    const hasManualSections = dto.ranges?.some((r) => r.questionType === 'manual') ?? false;
    if (base === GradingMode.SYSTEM && hasManualSections) return GradingMode.HYBRID;
    return base;
  }

  async validateSystemDto(dto: CreateAssessmentDto) {
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

  async createAssessmentRecord(orgId: string, classId: string, dto: CreateAssessmentDto, effectiveGradingMode: GradingMode) {
    return this.repo.create({
      orgId, classId,
      lessonId: dto.lessonId || undefined,
      termId: dto.termId,
      type: dto.type,
      title: dto.title,
      totalItems: dto.totalItems,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      weekNumber: dto.weekNumber,
      gradingMode: effectiveGradingMode,
      manualMaxScore: dto.manualMaxScore,
      showBreakdown: dto.showBreakdown,
    });
  }

  async createManualQuestions(orgId: string, assessmentId: string, dto: CreateAssessmentDto) {
    if (dto.manualInstructions?.trim()) {
      await this.repo.createQuestions([{
        orgId, assessmentId,
        type: 'manual',
        questionText: dto.manualInstructions.trim(),
        order: 1,
        isManual: true,
      }]);
    }
  }

  async createManualSectionQuestions(orgId: string, assessmentId: string, dto: CreateAssessmentDto) {
    const manualRanges = (dto.ranges ?? []).filter((r) => r.questionType === 'manual');
    if (!manualRanges.length) return;
    const manualQuestions = manualRanges
      .filter((r) => r.manualQuestionText?.trim())
      .map((r, idx) => ({
        orgId, assessmentId,
        type: 'manual',
        questionText: r.manualQuestionText!.trim(),
        order: idx + 1,
        isManual: true,
      }));
    if (manualQuestions.length > 0) {
      await this.repo.createQuestions(manualQuestions);
    }
  }
}