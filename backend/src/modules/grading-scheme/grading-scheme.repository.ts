// filepath: src/modules/grading-scheme/grading-scheme.repository.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradingSchemeComponentDto } from './dto/grading-scheme.dto';

const COMPONENTS_INCLUDE = {
  components: { orderBy: { created_at: 'asc' as const } },
};

function mapComponent(c: any) {
  return {
    id:              c.id,
    orgId:           c.org_id,
    gradingSchemeId: c.grading_scheme_id,
    name:            c.name,
    type:            c.type,
    weight:          c.weight,
    maxScore:        c.max_score,
    isOptional:      c.is_optional,
    createdAt:       c.created_at,
  };
}

function mapScheme(s: any) {
  return {
    id:         s.id,
    orgId:      s.org_id,
    classId:    s.class_id,
    templateId: s.template_id,
    name:       s.name,
    isLocked:   s.is_locked,
    lockedAt:   s.locked_at,
    createdAt:  s.created_at,
    components: s.components?.map(mapComponent) ?? [],
  };
}

@Injectable()
export class GradingSchemeRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByClassId(classId: string, orgId: string) {
    const scheme = await this.db.gradingScheme.findFirst({
      where:   { class_id: classId, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
    return scheme ? mapScheme(scheme) : null;
  }

  async findById(id: string, orgId: string) {
    const scheme = await this.db.gradingScheme.findFirst({
      where:   { id, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
    return scheme ? mapScheme(scheme) : null;
  }

  async create(
    orgId:      string,
    classId:    string,
    templateId: string | undefined,
    name:       string,
    components: GradingSchemeComponentDto[],
  ) {
    const scheme = await this.db.gradingScheme.create({
      data: {
        org_id:      orgId,
        class_id:    classId,
        template_id: templateId ?? null,
        name,
        is_locked:   false,
        locked_at:   null,
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

  async update(
    id:    string,
    orgId: string,
    data: { name?: string; components?: GradingSchemeComponentDto[] },
  ) {
    const updated = await this.db.$transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx.gradingScheme.update({
          where: { id },
          data:  { name: data.name },
        });
      }

      if (data.components !== undefined) {
        await tx.gradingSchemeComponent.deleteMany({
          where: { grading_scheme_id: id },
        });
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

      return tx.gradingScheme.findUnique({
        where:   { id },
        include: COMPONENTS_INCLUDE,
      });
    });

    return updated ? mapScheme(updated) : null;
  }

  async upsertForClass(
    orgId:      string,
    classId:    string,
    templateId: string | undefined,
    name:       string,
    components: GradingSchemeComponentDto[],
  ) {
    const existing = await this.findByClassId(classId, orgId);

    if (existing) {
      return this.update(existing.id, orgId, { name, components });
    }

    return this.create(orgId, classId, templateId, name, components);
  }

async findClassIdsByProgram(
  programId: string,
  orgId: string,
  schoolYearId?: string,
): Promise<string[]> {
  // Resolve all course/strand/level IDs that belong to this program
  const [courses, strands, levels] = await Promise.all([
    this.db.course.findMany({
      where: { org_id: orgId, program_id: programId },
      select: { id: true },
    }),
    this.db.strand.findMany({
      where: { org_id: orgId, program_id: programId },
      select: { id: true },
    }),
    this.db.level.findMany({
      where: { org_id: orgId, program_id: programId },
      select: { id: true },
    }),
  ]);

  const courseIds = courses.map((c) => c.id);
  const strandIds = strands.map((s) => s.id);
  const levelIds  = levels.map((l) => l.id);

  // Find all subjects linked to this program directly or via course/strand/level
  const subjects = await this.db.subject.findMany({
    where: {
      org_id: orgId,
      OR: [
        { program_id: programId },
        ...(courseIds.length ? [{ course_id: { in: courseIds } }] : []),
        ...(strandIds.length ? [{ strand_id: { in: strandIds } }] : []),
        ...(levelIds.length  ? [{ level_id:  { in: levelIds  } }] : []),
      ],
    },
    select: { id: true },
  });

  const subjectIds = subjects.map((s) => s.id);
  if (subjectIds.length === 0) return [];

  const classes = await this.db.class.findMany({
    where: {
      org_id:     orgId,
      deleted_at: null,
      subject_id: { in: subjectIds },
      ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
    },
    select: { id: true },
  });

  return classes.map((c) => c.id);
}

  async lockByClassId(classId: string) {
    return this.db.gradingScheme.updateMany({
      where: { class_id: classId },
      data:  { is_locked: true, locked_at: new Date() },
    });
  }
}