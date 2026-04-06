import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradingSchemeComponentDto } from './dto/grading-scheme.dto';

const COMPONENTS_INCLUDE = {
  components: { orderBy: { created_at: 'asc' as const } },
};

function mapComponent(c: any) {
  return {
    id:               c.id,
    orgId:            c.org_id,
    gradingSchemeId:  c.grading_scheme_id,
    name:             c.name,
    type:             c.type,
    weight:           c.weight,
    maxScore:         c.max_score,
    isOptional:       c.is_optional,
    createdAt:        c.created_at,
  };
}

function mapScheme(s: any) {
  return {
    id:           s.id,
    orgId:        s.org_id,
    educatorId:   s.educator_id,
    classId:      s.class_id,
    schoolYearId: s.school_year_id,
    name:         s.name,
    isDefault:    s.is_default,
    isLocked:     s.is_locked,
    lockedAt:     s.locked_at,
    createdAt:    s.created_at,
    components:   s.components?.map(mapComponent) ?? [],
  };
}

@Injectable()
export class GradingSchemeRepository {
  constructor(private readonly db: DatabaseService) {}

  async findDefault(orgId: string, schoolYearId: string) {
    const scheme = await this.db.gradingScheme.findFirst({
      where:   { org_id: orgId, school_year_id: schoolYearId, is_default: true },
      include: COMPONENTS_INCLUDE,
    });
    return scheme ? mapScheme(scheme) : null;
  }

  async createDefault(orgId: string, schoolYearId: string, name: string) {
    const scheme = await this.db.gradingScheme.create({
      data: {
        org_id:         orgId,
        school_year_id: schoolYearId,
        name,
        is_default:     true,
        educator_id:    null,
        class_id:       null,
        is_locked:      false,
        locked_at:      null,
      },
      include: COMPONENTS_INCLUDE,
    });
    return mapScheme(scheme);
  }

  async updateDefault(
    orgId:        string,
    schoolYearId: string,
    data: { name?: string; components?: GradingSchemeComponentDto[] },
  ) {
    const scheme = await this.db.gradingScheme.findFirst({
      where: { org_id: orgId, school_year_id: schoolYearId, is_default: true },
    });
    if (!scheme) return null;

    const updated = await this.db.$transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx.gradingScheme.update({
          where: { id: scheme.id },
          data:  { name: data.name },
        });
      }
      if (data.components !== undefined) {
        await tx.gradingSchemeComponent.deleteMany({
          where: { grading_scheme_id: scheme.id },
        });
        await tx.gradingSchemeComponent.createMany({
          data: data.components.map((c) => ({
            org_id:            orgId,
            grading_scheme_id: scheme.id,
            name:              c.name,
            type:              c.type,
            weight:            c.weight,
            max_score:         c.maxScore ?? null,
            is_optional:       c.isOptional ?? false,
          })),
        });
      }
      return tx.gradingScheme.findUnique({
        where:   { id: scheme.id },
        include: COMPONENTS_INCLUDE,
      });
    });

    return updated ? mapScheme(updated) : null;
  }

  async create(
    orgId:        string,
    schoolYearId: string,
    educatorId:   string,
    name:         string,
    components:   GradingSchemeComponentDto[],
  ) {
    const scheme = await this.db.gradingScheme.create({
      data: {
        org_id:         orgId,
        school_year_id: schoolYearId,
        educator_id:    educatorId,
        name,
        is_default:     false,
        class_id:       null,
        is_locked:      false,
        locked_at:      null,
        components: {
          create: components.map((c) => ({
            org_id:      orgId,
            name:        c.name,
            type:        c.type,
            weight:      c.weight,
            max_score:   c.maxScore ?? null,
            is_optional: c.isOptional ?? false,
          })),
        },
      },
      include: COMPONENTS_INCLUDE,
    });
    return mapScheme(scheme);
  }

  async findByEducator(orgId: string, schoolYearId: string, educatorId: string) {
    const schemes = await this.db.gradingScheme.findMany({
      where:   { org_id: orgId, school_year_id: schoolYearId, educator_id: educatorId, is_default: false },
      include: COMPONENTS_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    return schemes.map(mapScheme);
  }

  async findById(id: string, orgId: string) {
    const scheme = await this.db.gradingScheme.findFirst({
      where:   { id, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
    return scheme ? mapScheme(scheme) : null;
  }

  async update(
    id:     string,
    orgId:  string,
    data: { name?: string; components?: GradingSchemeComponentDto[] },
  ) {
    const updated = await this.db.$transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx.gradingScheme.update({ where: { id }, data: { name: data.name } });
      }
      if (data.components !== undefined) {
        await tx.gradingSchemeComponent.deleteMany({ where: { grading_scheme_id: id } });
        await tx.gradingSchemeComponent.createMany({
          data: data.components.map((c) => ({
            org_id:            orgId,
            grading_scheme_id: id,
            name:              c.name,
            type:              c.type,
            weight:            c.weight,
            max_score:         c.maxScore ?? null,
            is_optional:       c.isOptional ?? false,
          })),
        });
      }
      return tx.gradingScheme.findUnique({ where: { id }, include: COMPONENTS_INCLUDE });
    });
    return updated ? mapScheme(updated) : null;
  }

  async findForClass(classId: string, orgId: string) {
    const classScheme = await this.db.gradingScheme.findFirst({
      where:   { class_id: classId, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
    if (classScheme) return mapScheme(classScheme);

    // Fall back to school-year default — get school year from class
    const cls = await this.db.class.findFirst({
      where:  { id: classId, org_id: orgId },
      select: { school_year_id: true },
    });
    if (!cls) return null;

    const defaultScheme = await this.db.gradingScheme.findFirst({
      where:   { org_id: orgId, school_year_id: cls.school_year_id, is_default: true },
      include: COMPONENTS_INCLUDE,
    });
    return defaultScheme ? mapScheme(defaultScheme) : null;
  }

  async assignToClass(id: string, classId: string) {
    const scheme = await this.db.gradingScheme.update({
      where:   { id },
      data:    { class_id: classId },
      include: COMPONENTS_INCLUDE,
    });
    return mapScheme(scheme);
  }

  async lockById(id: string) {
    const scheme = await this.db.gradingScheme.update({
      where:   { id },
      data:    { is_locked: true, locked_at: new Date() },
      include: COMPONENTS_INCLUDE,
    });
    return mapScheme(scheme);
  }

  async lockByClassId(classId: string) {
    return this.db.gradingScheme.updateMany({
      where: { class_id: classId },
      data:  { is_locked: true, locked_at: new Date() },
    });
  }
}