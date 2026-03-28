import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradingSchemeComponentDto } from './dto/grading-scheme.dto';

const COMPONENTS_INCLUDE = {
  components: {
    orderBy: { created_at: 'asc' as const },
  },
};

@Injectable()
export class GradingSchemeRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Default (org-level, admin-managed) ───────────────────────────────────

  async findDefault(orgId: string) {
    return this.db.gradingScheme.findFirst({
      where: { org_id: orgId, is_default: true },
      include: COMPONENTS_INCLUDE,
    });
  }

  async createDefault(orgId: string, name: string) {
    return this.db.gradingScheme.create({
      data: {
        org_id: orgId,
        name,
        is_default: true,
        educator_id: null,
        class_id: null,
        is_locked: false,
        locked_at: null,
      },
      include: COMPONENTS_INCLUDE,
    });
  }

  /**
   * Replace all components on the default scheme.
   * Uses a transaction: delete existing → create new.
   */
  async updateDefault(
    orgId: string,
    data: { name?: string; components?: GradingSchemeComponentDto[] },
  ) {
    const scheme = await this.findDefault(orgId);
    if (!scheme) return null;

    return this.db.$transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx.gradingScheme.update({
          where: { id: scheme.id },
          data: { name: data.name },
        });
      }

      if (data.components !== undefined) {
        await tx.gradingSchemeComponent.deleteMany({
          where: { grading_scheme_id: scheme.id },
        });
        await tx.gradingSchemeComponent.createMany({
          data: data.components.map((c) => ({
            org_id: orgId,
            grading_scheme_id: scheme.id,
            name: c.name,
            type: c.type,
            weight: c.weight,
            max_score: c.max_score ?? null,
            is_optional: c.is_optional ?? false,
          })),
        });
      }

      return tx.gradingScheme.findUnique({
        where: { id: scheme.id },
        include: COMPONENTS_INCLUDE,
      });
    });
  }

  // ── Educator personal library ─────────────────────────────────────────────

  async create(
    orgId: string,
    educatorId: string,
    name: string,
    components: GradingSchemeComponentDto[],
  ) {
    return this.db.gradingScheme.create({
      data: {
        org_id: orgId,
        educator_id: educatorId,
        name,
        is_default: false,
        class_id: null,
        is_locked: false,
        locked_at: null,
        components: {
          create: components.map((c) => ({
            org_id: orgId,
            name: c.name,
            type: c.type,
            weight: c.weight,
            max_score: c.max_score ?? null,
            is_optional: c.is_optional ?? false,
          })),
        },
      },
      include: COMPONENTS_INCLUDE,
    });
  }

  async findByEducator(orgId: string, educatorId: string) {
    return this.db.gradingScheme.findMany({
      where: { org_id: orgId, educator_id: educatorId, is_default: false },
      include: COMPONENTS_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.gradingScheme.findFirst({
      where: { id, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
  }

  /**
   * Replace all components on an educator scheme.
   * Uses a transaction: delete existing → create new.
   */
  async update(
    id: string,
    orgId: string,
    data: { name?: string; components?: GradingSchemeComponentDto[] },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx.gradingScheme.update({
          where: { id },
          data: { name: data.name },
        });
      }

      if (data.components !== undefined) {
        await tx.gradingSchemeComponent.deleteMany({
          where: { grading_scheme_id: id },
        });
        await tx.gradingSchemeComponent.createMany({
          data: data.components.map((c) => ({
            org_id: orgId,
            grading_scheme_id: id,
            name: c.name,
            type: c.type,
            weight: c.weight,
            max_score: c.max_score ?? null,
            is_optional: c.is_optional ?? false,
          })),
        });
      }

      return tx.gradingScheme.findUnique({
        where: { id },
        include: COMPONENTS_INCLUDE,
      });
    });
  }

  // ── Class assignment & locking ────────────────────────────────────────────

  async findForClass(classId: string, orgId: string) {
    // Class-specific scheme first, fall back to org default
    const classScheme = await this.db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
    if (classScheme) return classScheme;

    return this.db.gradingScheme.findFirst({
      where: { org_id: orgId, is_default: true },
      include: COMPONENTS_INCLUDE,
    });
  }

  async assignToClass(id: string, classId: string) {
    return this.db.gradingScheme.update({
      where: { id },
      data: { class_id: classId },
      include: COMPONENTS_INCLUDE,
    });
  }

  async lockById(id: string) {
    return this.db.gradingScheme.update({
      where: { id },
      data: { is_locked: true, locked_at: new Date() },
      include: COMPONENTS_INCLUDE,
    });
  }

  async lockByClassId(classId: string) {
    return this.db.gradingScheme.updateMany({
      where: { class_id: classId },
      data: { is_locked: true, locked_at: new Date() },
    });
  }
}