import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

const PROGRAM_LIST_INCLUDE = {
  courses: {
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' as const },
  },
  strands: {
    select: { id: true, name: true },
    orderBy: { name: 'asc' as const },
  },
};

const PROGRAM_DETAIL_INCLUDE = {
  courses: {
    orderBy: { name: 'asc' as const },
    include: {
      subjects: {
        select: {
          id: true,
          name: true,
          year_level: true,
          term_label: true,
          is_locked: true,
        },
        orderBy: [
          { year_level: 'asc' as const },
          { term_label: 'asc' as const },
          { name: 'asc' as const },
        ],
      },
    },
  },
  strands: {
    orderBy: { name: 'asc' as const },
    include: {
      subjects: {
        select: {
          id: true,
          name: true,
          year_level: true,
          term_label: true,
          is_locked: true,
        },
        orderBy: [
          { year_level: 'asc' as const },
          { term_label: 'asc' as const },
          { name: 'asc' as const },
        ],
      },
    },
  },
};

@Injectable()
export class ProgramRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    schoolYearId: string;
    name: string;
    type: string;
  }) {
    return this.db.program.create({
      data: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        name: data.name,
        type: data.type,
      },
      include: PROGRAM_LIST_INCLUDE,
    });
  }

  async findAll(
    orgId: string,
    schoolYearId: string,
    includeAssignment = false,
  ) {
    return this.db.program.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
      },
      include: {
        ...PROGRAM_LIST_INCLUDE,

        // ✅ conditional include
        ...(includeAssignment && {
          semesterAssignment: {
            include: {
              template: {
                select: { id: true, name: true },
              },
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllWithStats(orgId: string, schoolYearId: string) {
    const programs = await this.db.program.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
      },
      select: {
        id: true,
        org_id: true,
        school_year_id: true,
        name: true,
        type: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch related data based on program type
    const programIds = programs.map((p) => p.id);

    const [levels, courses, strands] = await Promise.all([
      this.db.level.findMany({
        where: { program_id: { in: programIds } },
        select: { id: true, name: true, program_id: true },
        orderBy: { name: 'asc' },
      }),
      this.db.course.findMany({
        where: { program_id: { in: programIds } },
        select: { id: true, name: true, code: true, program_id: true },
        orderBy: { name: 'asc' },
      }),
      this.db.strand.findMany({
        where: { program_id: { in: programIds } },
        select: { id: true, name: true, program_id: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Group related data by program_id
    const levelsByProgram = levels.reduce(
      (acc, level) => {
        if (!acc[level.program_id]) acc[level.program_id] = [];
        acc[level.program_id].push(level);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const coursesByProgram = courses.reduce(
      (acc, course) => {
        if (!acc[course.program_id]) acc[course.program_id] = [];
        acc[course.program_id].push(course);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const strandsByProgram = strands.reduce(
      (acc, strand) => {
        if (!acc[strand.program_id]) acc[strand.program_id] = [];
        acc[strand.program_id].push(strand);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Combine programs with their stats
    return programs.map((program) => ({
      ...program,
      levels: levelsByProgram[program.id] || [],
      courses: coursesByProgram[program.id] || [],
      strands: strandsByProgram[program.id] || [],
    }));
  }

  async findById(id: string, orgId: string) {
    return this.db.program.findFirst({
      where: { id, org_id: orgId },
      include: PROGRAM_DETAIL_INCLUDE,
    });
  }

  async findByNameAndYear(name: string, orgId: string, schoolYearId: string) {
    return this.db.program.findFirst({
      where: { name, org_id: orgId, school_year_id: schoolYearId },
      select: { id: true },
    });
  }

  async update(id: string, data: { name?: string; type?: string }) {
    return this.db.program.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
      },
      include: PROGRAM_LIST_INCLUDE,
    });
  }

  async delete(id: string) {
    return this.db.program.delete({ where: { id } });
  }

  async hasLevels(programId: string): Promise<boolean> {
    const count = await this.db.level.count({
      where: { program_id: programId },
    });
    return count > 0;
  }

  async hasCourses(programId: string): Promise<boolean> {
    const count = await this.db.course.count({
      where: { program_id: programId },
    });
    return count > 0;
  }

  async hasStrands(programId: string): Promise<boolean> {
    const count = await this.db.strand.count({
      where: { program_id: programId },
    });
    return count > 0;
  }
}
