// ===== File: backend\src\modules\semester-template\semester-template.repository.ts =====
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

const TEMPLATE_INCLUDE = {
  semesters: {
    orderBy: { order_index: 'asc' as const },
    include: {
      terms: { orderBy: { order_index: 'asc' as const } },
    },
  },
};

@Injectable()
export class SemesterTemplateRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    programType: string;
    name: string;
    semesters: Array<{
      name: string;
      orderIndex: number;
      terms: Array<{ name: string; orderIndex: number }>;
    }>;
  }) {
    return this.db.semesterTemplate.create({
      data: {
        org_id: data.orgId,
        program_type: data.programType,
        name: data.name,
        semesters: {
          create: data.semesters.map((sem) => ({
            org_id: data.orgId,
            name: sem.name,
            order_index: sem.orderIndex,
            terms: {
              create: sem.terms.map((t) => ({
                org_id: data.orgId,
                name: t.name,
                order_index: t.orderIndex,
              })),
            },
          })),
        },
      },
      include: TEMPLATE_INCLUDE,
    });
  }

  /** Get all templates for org, no school-year filter */
  async getAllForOrg(orgId: string) {
    return this.db.semesterTemplate.findMany({
      where: { org_id: orgId },
      include: TEMPLATE_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.semesterTemplate.findFirst({
      where: { id, org_id: orgId },
      include: TEMPLATE_INCLUDE,
    });
  }

  async existsByName(
    orgId: string,
    programType: string,
    name: string,
    excludeId?: string,
  ) {
    return this.db.semesterTemplate.findFirst({
      where: {
        org_id: orgId,
        program_type: programType,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async update(id: string, data: { name?: string }) {
    return this.db.semesterTemplate.update({
      where: { id },
      data: { ...(data.name ? { name: data.name } : {}) },
    });
  }

  async replaceSemesters(
    templateId: string,
    orgId: string,
    semesters: Array<{
      name: string;
      orderIndex: number;
      terms: Array<{ name: string; orderIndex: number }>;
    }>,
  ) {
    await this.db.semesterTemplateItem.deleteMany({
      where: { template_id: templateId },
    });

    return this.db.$transaction(
      semesters.map((sem) =>
        this.db.semesterTemplateItem.create({
          data: {
            org_id: orgId,
            template_id: templateId,
            name: sem.name,
            order_index: sem.orderIndex,
            terms: {
              create: sem.terms.map((t) => ({
                org_id: orgId,
                name: t.name,
                order_index: t.orderIndex,
              })),
            },
          },
        }),
      ),
    );
  }

  async delete(id: string) {
    const items = await this.db.semesterTemplateItem.findMany({
      where: { template_id: id },
    });
    await this.db.$transaction([
      this.db.semesterTemplateTerm.deleteMany({
        where: { semester_id: { in: items.map((i) => i.id) } },
      }),
      this.db.semesterTemplateItem.deleteMany({ where: { template_id: id } }),
      this.db.semesterTemplate.delete({ where: { id } }),
    ]);
  }

  async assignToProgram(data: { orgId: string; programId: string; templateId: string }) {
    return this.db.programSemesterAssignment.upsert({
      where: { program_id: data.programId },
      update: { template_id: data.templateId },
      create: {
        org_id: data.orgId,
        program_id: data.programId,
        template_id: data.templateId,
      },
    });
  }

  async removeAssignment(programId: string, orgId: string) {
    return this.db.programSemesterAssignment.deleteMany({
      where: { program_id: programId, org_id: orgId },
    });
  }

  /** Get all assignments, no school-year filter */
  async findAllAssignments(orgId: string) {
    return this.db.programSemesterAssignment.findMany({
      where: { org_id: orgId },
      include: {
        template: { include: TEMPLATE_INCLUDE },
        program: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async findAssignmentByProgram(programId: string, orgId: string) {
    return this.db.programSemesterAssignment.findFirst({
      where: { program_id: programId, org_id: orgId },
      include: { template: { include: TEMPLATE_INCLUDE } },
    });
  }
  async findAllBySchoolYear(orgId: string, schoolYearId: string) {
    // Get all templates that are assigned to at least one program in this school year
    return this.db.semesterTemplate.findMany({
      where: {
        org_id: orgId,
        assignments: {
          some: {
            program: { school_year_id: schoolYearId },
          },
        },
      },
      include: TEMPLATE_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  async findAssignmentsBySchoolYear(orgId: string, schoolYearId: string) {
    return this.db.programSemesterAssignment.findMany({
      where: {
        org_id: orgId,
        program: { school_year_id: schoolYearId },
      },
      include: {
        template: { include: TEMPLATE_INCLUDE },
        program: { select: { id: true, name: true, type: true, school_year_id: true } },
      },
    });
  }
}