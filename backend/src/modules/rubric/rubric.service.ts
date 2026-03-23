// src/modules/rubric/rubric.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RubricRepository } from './rubric.repository';
import {
  CreateRubricDto,
  UpdateRubricDto,
  UpdateDefaultRubricDto,
  RubricCategoryDto,
} from './dto/rubric.dto';

@Injectable()
export class RubricService {
  constructor(private readonly rubricRepository: RubricRepository) {}

  // ── Weight validation ───────────────────────────────────────────────────────

  /**
   * All category weights must sum to exactly 100%.
   * System spec: "All weights must total exactly 100%."
   */
  private validateWeights(categories: RubricCategoryDto[]): void {
    if (categories.length === 0) {
      throw new BadRequestException(
        'At least one rubric category is required.',
      );
    }

    const total = categories.reduce((sum, c) => sum + c.weight, 0);

    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Rubric category weights must total exactly 100%. Current total: ${total}%.`,
      );
    }

    // assessment_linked categories must specify at least one assessment type
    for (const cat of categories) {
      if (
        cat.type === 'assessment_linked' &&
        (!cat.assessmentTypes || cat.assessmentTypes.length === 0)
      ) {
        throw new BadRequestException(
          `Category "${cat.name}" is assessment-linked but has no assessment types specified.`,
        );
      }
    }
  }

  // ── GET /rubrics/default ────────────────────────────────────────────────────

  async getDefault(orgId: string) {
    const rubric = await this.rubricRepository.findDefault(orgId);

    // Auto-create a blank default if none exists yet
    if (!rubric) {
      return this.rubricRepository.createDefault({
        orgId,
        name: 'Default Rubric',
        categories: [],
      });
    }

    return rubric;
  }

  // ── PATCH /rubrics/default ──────────────────────────────────────────────────

  async updateDefault(orgId: string, dto: UpdateDefaultRubricDto) {
    // Ensure default exists
    await this.getDefault(orgId);

    if (dto.categories) {
      this.validateWeights(dto.categories);
    }

    await this.rubricRepository.updateDefault(orgId, {
      name: dto.name,
      categories: dto.categories,
    });

    return this.rubricRepository.findDefault(orgId);
  }

  // ── POST /rubrics ───────────────────────────────────────────────────────────

  async create(orgId: string, educatorId: string, dto: CreateRubricDto) {
    this.validateWeights(dto.categories);

    return this.rubricRepository.create({
      orgId,
      educatorId,
      name: dto.name,
      categories: dto.categories,
    });
  }

  // ── GET /rubrics ────────────────────────────────────────────────────────────

  async findByEducator(orgId: string, educatorId: string) {
    return this.rubricRepository.findByEducator(orgId, educatorId);
  }

  // ── PATCH /rubrics/:id ──────────────────────────────────────────────────────

  async update(
    id: string,
    orgId: string,
    educatorId: string,
    dto: UpdateRubricDto,
  ) {
    const rubric = await this.rubricRepository.findById(id, orgId);

    if (!rubric) {
      throw new NotFoundException('Rubric not found.');
    }

    // Educators can only edit their own rubrics
    if (rubric.educator_id !== educatorId) {
      throw new ForbiddenException(
        'You can only edit rubrics from your own library.',
      );
    }

    if (rubric.is_locked) {
      throw new BadRequestException(
        'This rubric is locked because students are enrolled in the class. ' +
          'It cannot be modified.',
      );
    }

    if (dto.categories) {
      this.validateWeights(dto.categories);
    }

    return this.rubricRepository.update(id, {
      name: dto.name,
      categories: dto.categories,
    });
  }

  // ── Utility (called by enrollment module in Phase 3) ────────────────────────

  /**
   * Locks the rubric tied to a class.
   * Triggered when the first student is enrolled in the class.
   * Per spec: "Once the first student is enrolled in a class,
   * the rubric locks permanently."
   */
  async lockForClass(classId: string) {
    return this.rubricRepository.lockByClassId(classId);
  }

  /**
   * Assigns a rubric to a class (pre-fills from org default or educator choice).
   * Called when a class is created in Phase 3.
   */
  async assignToClass(rubricId: string, classId: string) {
    return this.rubricRepository.assignToClass(rubricId, classId);
  }

  async findById(id: string, orgId: string) {
    const rubric = await this.rubricRepository.findById(id, orgId);

    if (!rubric) {
      throw new NotFoundException('Rubric not found.');
    }

    return rubric;
  }
}