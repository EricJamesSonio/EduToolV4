// @/modules/school-year/school-year.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SchoolYearRepository } from './school-year.repository';
import { LevelService } from '@/modules/level/level.service';
import { SubjectService } from '@/modules/subject/subject.service';
import { CreateSchoolYearDto, UpdateSchoolYearDto } from './dto/school-year.dto';
import { GradingScaleService } from '../grading-scale/grading-scale.service';

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly levelService: LevelService,
    private readonly subjectService: SubjectService,
    private readonly gradingScaleService : GradingScaleService
  ) {}

  // ── POST /school-years ──────────────────────────────────────────────────────

  /**
   * Creates a new school year with status = pending.
   * Phase 3: will seed level structure from level defaults after creation.
    */
  async create(orgId: string, dto: CreateSchoolYearDto) {
    const schoolYear = await this.schoolYearRepository.create({
      orgId,
      name: dto.name,
    })

    // seedFromDefaults now needs programs seeded for this school year first
    // For UI-created school years, no programs exist yet — seed is empty
    // Programs are added manually by admin or via the seeder
    // So we pass an empty programMap — levels will be seeded when programs are added
    await this.levelService.seedFromDefaults(orgId, schoolYear.id, {})

    return schoolYear
  }

  // ── GET /school-years ───────────────────────────────────────────────────────

  async findAll(orgId: string) {
    return this.schoolYearRepository.findAll(orgId);
  }

  // ── PATCH /school-years/:id ─────────────────────────────────────────────────

  /**
   * Updates the name only.
   * Cannot update a school year that has ended — it is read-only.
   */
  async update(id: string, orgId: string, dto: UpdateSchoolYearDto) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);

    if (!schoolYear) {
      throw new NotFoundException('School year not found.');
    }

    if (schoolYear.status === 'ended') {
      throw new BadRequestException(
        'Ended school years are archived and cannot be modified.',
      );
    }

    return this.schoolYearRepository.updateName(id, dto.name!);
  }

  // ── PATCH /school-years/:id/activate ───────────────────────────────────────

  /**
   * Transitions a school year from pending → active.
   * Only one active school year is allowed per org at any time.
   * The currently active year must be ended before activating a new one.
   */
    async activate(id: string, orgId: string) {
      const schoolYear = await this.schoolYearRepository.findById(id, orgId);
      if (!schoolYear) throw new NotFoundException('School year not found.');
      if (schoolYear.status === 'active')
        throw new ConflictException('This school year is already active.');
      if (schoolYear.status === 'ended')
        throw new BadRequestException('An ended school year cannot be reactivated.');

      const activeCount = await this.schoolYearRepository.countActive(orgId);
      if (activeCount > 0)
        throw new ConflictException(
          'Another school year is currently active. End it before activating a new one.',
        );

      // Find the previously active year before we switch status
      const previousActive = await this.schoolYearRepository.findActive(orgId);

      const result = await this.schoolYearRepository.updateStatus(id, 'active');

      await this.subjectService.unlockAllForOrg(orgId);

      // ✅ NEW: unlock grading scales from the previous school year
      if (previousActive) {
        await this.gradingScaleService.unlockAllForSchoolYear(
          previousActive.id,
          orgId,
        );
      }

      return result;
    }

  // ── PATCH /school-years/:id/end ─────────────────────────────────────────────

  /**
   * Transitions a school year from active → ended.
   * Ended years are permanently archived and read-only.
   * Only an active year can be ended.
   */
  async end(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);

    if (!schoolYear) {
      throw new NotFoundException('School year not found.');
    }

    if (schoolYear.status === 'ended') {
      throw new ConflictException('This school year has already ended.');
    }

    if (schoolYear.status === 'pending') {
      throw new BadRequestException(
        'A pending school year cannot be ended. Activate it first.',
      );
    }

    return this.schoolYearRepository.updateStatus(id, 'ended');
  }

  // ── Utility (used by other modules in Phase 3) ──────────────────────────────

  async findById(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);

    if (!schoolYear) {
      throw new NotFoundException('School year not found.');
    }

    return schoolYear;
  }

  async findActive(orgId: string) {
    return this.schoolYearRepository.findActive(orgId);
  }
}