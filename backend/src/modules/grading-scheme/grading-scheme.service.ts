import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { GradingSchemeRepository } from './grading-scheme.repository';
import { GradingSchemeTemplateService } from '@/modules/grading-scheme-template/grading-scheme-template.service';
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';
import { DatabaseService } from '@/core/database/database.provider';
import {
  findStartedSemesterClassIds,
  getClassSemesterInfo,
} from '@/commons/utils/semester-lock.util';
import {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
  ApplyTemplateToClassDto,
  ApplyTemplateToProgramDto,
  GradingSchemeComponentDto,
} from './dto/grading-scheme.dto';

@Injectable()
export class GradingSchemeService {
  constructor(
    private readonly repo: GradingSchemeRepository,
    private readonly templateService: GradingSchemeTemplateService,
    private readonly db: DatabaseService,
    private readonly gradeRefresh: GradeEducatorService,
  ) {}

  /** Orgs that never saved a setting keep the old behaviour: educators may edit. */
  private async getAllowEducatorOverride(orgId: string): Promise<boolean> {
    const setting = await this.db.orgEnrollmentSetting.findUnique({
      where: { org_id: orgId },
      select: { allow_educator_scheme_override: true },
    });
    return setting?.allow_educator_scheme_override ?? true;
  }

  private async assertRoleMayEdit(
    orgId: string,
    role?: string,
  ): Promise<void> {
    if (role !== 'educator') return;
    const allowed = await this.getAllowEducatorOverride(orgId);
    if (!allowed) {
      throw new ForbiddenException(
        'Your school does not allow educators to change class grading schemes. Please ask an administrator.',
      );
    }
  }

  /**
   * Once the class's semester has started, an existing scheme is frozen until
   * the semester is over. It can still be changed for semesters that have not
   * started yet.
   */
  private async assertSemesterNotStarted(
    orgId: string,
    classId: string,
  ): Promise<void> {
    const info = await getClassSemesterInfo(this.db, orgId, classId);
    if (info.started) {
      throw new ConflictException(
        `The grading scheme is locked because ${info.semesterName ?? 'the semester'} has already started. It can only be changed for a semester that has not started yet.`,
      );
    }
  }

  /**
   * Guard chosen by the user: edits may change weights and add categories
   * freely, but removing a component type that existing (non-deleted)
   * assessments already use is rejected so assessments are never orphaned.
   */
  private async assertNoOrphanedAssessments(
    orgId: string,
    classId: string,
    components: GradingSchemeComponentDto[],
  ): Promise<void> {
    const inUse = await this.db.assessment.findMany({
      where: { org_id: orgId, class_id: classId, deleted_at: null },
      select: { type: true },
    });
    if (inUse.length === 0) return;
    const usedTypes: string[] = [...new Set(inUse.map((a) => a.type))];
    const nextTypes: Set<string> = new Set(
      components.map((c) => c.type as string),
    );
    const removed = usedTypes.filter((t) => !nextTypes.has(t));
    if (removed.length > 0) {
      throw new BadRequestException(
        `Cannot remove category type(s) ${removed.join(', ')} — assessments of that type already exist in this class.`,
      );
    }
  }

  private async refreshBestEffort(
    orgId: string,
    classId: string,
    actorId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.gradeRefresh.refreshClassGrades(
        orgId,
        classId,
        actorId,
        reason,
      );
    } catch {
      // Grades refresh must never fail the scheme save itself.
    }
  }

  private validateWeights(components: GradingSchemeComponentDto[]): void {
    if (components.length === 0) {
      throw new BadRequestException(
        'At least one grading scheme component is required.',
      );
    }

    const required = components.filter((c) => !c.isOptional);
    const total = required.reduce((sum, c) => sum + c.weight, 0);

    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Required component weights must total exactly 100%. Current total: ${total}%.`,
      );
    }
  }

  async findByClass(classId: string, orgId: string) {
    return this.repo.findByClassId(classId, orgId);
  }

  /** What the requesting user may do with this class's scheme, and why not. */
  async getClassStatus(classId: string, orgId: string, role?: string) {
    const [allowEducatorOverride, semester, scheme] = await Promise.all([
      this.getAllowEducatorOverride(orgId),
      getClassSemesterInfo(this.db, orgId, classId),
      this.repo.findByClassId(classId, orgId),
    ]);

    const hasScheme = !!scheme;
    const lockedBySemester = hasScheme && semester.started;
    const educatorBlocked = role === 'educator' && !allowEducatorOverride;

    let lockReason: 'educator_override_disabled' | 'semester_started' | null =
      null;
    if (educatorBlocked) lockReason = 'educator_override_disabled';
    else if (lockedBySemester) lockReason = 'semester_started';

    return {
      allowEducatorOverride,
      hasScheme,
      lockedBySemester,
      semesterName: semester.semesterName,
      semesterStartDate: semester.startDate,
      lockReason,
      canEdit: lockReason === null,
    };
  }

  async create(orgId: string, dto: CreateGradingSchemeDto, role?: string) {
    await this.assertRoleMayEdit(orgId, role);

    const existing = await this.repo.findByClassId(dto.classId, orgId);

    if (existing) {
      throw new BadRequestException(
        'This class already has a grading scheme. Use update instead.',
      );
    }

    this.validateWeights(dto.components);

    return this.repo.create(
      orgId,
      dto.classId,
      dto.templateId,
      dto.name,
      dto.components,
    );
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateGradingSchemeDto,
    actorId?: string,
    role?: string,
  ) {
    await this.assertRoleMayEdit(orgId, role);

    const scheme = await this.repo.findById(id, orgId);

    if (!scheme) throw new NotFoundException('Grading scheme not found.');

    await this.assertSemesterNotStarted(orgId, scheme.classId);

    if (dto.components) {
      this.validateWeights(dto.components);
      await this.assertNoOrphanedAssessments(
        orgId,
        scheme.classId,
        dto.components,
      );
    }

    const updated = await this.repo.update(id, orgId, {
      name: dto.name,
      components: dto.components,
    });

    if (!updated) throw new NotFoundException('Grading scheme not found.');

    if (dto.components && actorId) {
      await this.refreshBestEffort(
        orgId,
        scheme.classId,
        actorId,
        'grading_scheme_updated',
      );
    }

    return updated;
  }

  async applyTemplateToClass(
    orgId: string,
    dto: ApplyTemplateToClassDto,
    actorId?: string,
  ) {
    const template = await this.templateService.findById(dto.templateId, orgId);

    const components: GradingSchemeComponentDto[] = template.components.map(
      (c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        maxScore: c.maxScore ?? undefined,
      }),
    );

    this.validateWeights(components);

    const existing = await this.repo.findByClassId(dto.classId, orgId);
    if (existing) {
      await this.assertSemesterNotStarted(orgId, dto.classId);
    }

    await this.assertNoOrphanedAssessments(orgId, dto.classId, components);

    const result = await this.repo.upsertForClass(
      orgId,
      dto.classId,
      dto.templateId,
      dto.name ?? template.name,
      components,
    );

    if (actorId) {
      await this.refreshBestEffort(
        orgId,
        dto.classId,
        actorId,
        'grading_scheme_template_applied',
      );
    }

    return result;
  }

  async applyTemplateToProgram(
    orgId: string,
    dto: ApplyTemplateToProgramDto,
    actorId?: string,
  ) {
    const template = await this.templateService.findById(dto.templateId, orgId);

    const classIds = await this.repo.findClassIdsByProgram(
      dto.programId,
      orgId,
    );

    if (classIds.length === 0) {
      throw new BadRequestException('No classes found under this program.');
    }

    const components: GradingSchemeComponentDto[] = template.components.map(
      (c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        maxScore: c.maxScore ?? undefined,
      }),
    );

    this.validateWeights(components);

    // Classes whose semester already started and that already have a scheme
    // are frozen: they are skipped, never overwritten.
    const [withSchemes, startedIds] = await Promise.all([
      this.db.gradingScheme.findMany({
        where: { org_id: orgId, class_id: { in: classIds } },
        select: { class_id: true },
      }),
      findStartedSemesterClassIds(this.db, orgId, classIds),
    ]);
    const hasScheme = new Set(withSchemes.map((s) => s.class_id));

    const results = await Promise.allSettled(
      classIds.map(async (classId) => {
        if (hasScheme.has(classId) && startedIds.has(classId)) {
          throw new ConflictException(
            'Grading scheme is locked because the semester already started.',
          );
        }
        await this.assertNoOrphanedAssessments(orgId, classId, components);
        const saved = await this.repo.upsertForClass(
          orgId,
          classId,
          dto.templateId,
          template.name,
          components,
        );
        if (actorId) {
          await this.refreshBestEffort(
            orgId,
            classId,
            actorId,
            'grading_scheme_template_applied_program',
          );
        }
        return saved;
      }),
    );

    const applied = results.filter((r) => r.status === 'fulfilled').length;
    const skipped = results.filter((r) => r.status === 'rejected').length;

    return { applied, skipped, total: classIds.length };
  }

  async lockForClass(classId: string) {
    return this.repo.lockByClassId(classId);
  }

  async getAllowedAssessmentTypes(
    classId: string,
    orgId: string,
  ): Promise<string[]> {
    const scheme = await this.repo.findByClassId(classId, orgId);
    if (!scheme) return [];
    return scheme.components.map((c) => c.type);
  }
}