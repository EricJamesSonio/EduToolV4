import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { CreatePrerequisiteDto } from './dto/subject-prerequisite.dto';

@Injectable()
export class SubjectPrerequisiteRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(orgId: string, dto: CreatePrerequisiteDto) {
    return this.db.subjectPrerequisite.create({
      data: {
        org_id: orgId,
        subject_id: dto.subject_id,
        prerequisite_id: dto.prerequisite_id,
      },
    });
  }

  async bulkCreate(
    org_id: string,
    subject_id: string,
    prerequisite_ids: string[],
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.subjectPrerequisite.deleteMany({
        where: { subject_id, org_id },
      });
      return tx.subjectPrerequisite.createMany({
        data: prerequisite_ids.map((prerequisite_id) => ({
          org_id,
          subject_id,
          prerequisite_id,
        })),
        skipDuplicates: true,
      });
    });
  }

  async findBySubject(subject_id: string, org_id: string) {
    return this.db.subjectPrerequisite.findMany({
      where: { subject_id, org_id },
      include: {
        prerequisite: {
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
    });
  }

  /**
   * Batched defined-links lookup for the eligibility fallback path (subjects
   * whose grade-enriched rows came back empty).
   */
  async findBySubjects(subject_ids: string[], org_id: string) {
    if (subject_ids.length === 0) return [];
    return this.db.subjectPrerequisite.findMany({
      where: { subject_id: { in: [...new Set(subject_ids)] }, org_id },
      include: {
        prerequisite: {
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
    });
  }

  async findOne(subject_id: string, prerequisite_id: string, org_id: string) {
    return this.db.subjectPrerequisite.findFirst({
      where: { subject_id, prerequisite_id, org_id },
    });
  }

  async delete(id: string) {
    return this.db.subjectPrerequisite.delete({ where: { id } });
  }

  // Fetch all prerequisite subjects + the student's Grade records for them in one query
  async getPrerequisitesWithGrades(
    subject_id: string,
    student_id: string,
    org_id: string,
  ) {
    const prereqs = await this.db.subjectPrerequisite.findMany({
      where: { subject_id, org_id },
      include: {
        prerequisite: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (prereqs.length === 0) return [];

    const prerequisiteSubjectIds = prereqs.map((p) => p.prerequisite_id);

    // Find classes the student was enrolled in that used those subjects.
    // Ordered by the effective academic period (school year start) so the
    // "latest grade wins" resolution below is deterministic across school years.
    const grades = await this.db.grade.findMany({
      where: {
        org_id,
        student_id,
        is_locked: true,
        class: {
          subject_id: { in: prerequisiteSubjectIds },
        },
      },
      orderBy: [
        { class: { schoolYear: { start_date: 'asc' } } },
        { id: 'asc' },
      ],
      include: {
        class: {
          select: { id: true, subject_id: true, school_year_id: true },
        },
      },
    });

    return prereqs.map((p) => {
      const matches = grades.filter(
        (g) => g.class.subject_id === p.prerequisite_id,
      );
      return {
        subject_id: p.prerequisite_id,
        subject_name: p.prerequisite.name,
        grade: matches.length > 0 ? matches[matches.length - 1] : null,
      };
    });
  }

  // Batched variant of getPrerequisitesWithGrades for many subjects at once
  // (Perf Phase 5): 2 queries total instead of 2 per subject. Latest-wins
  // grade resolution is identical to the single path. Returns rows grouped
  // by subject id; subjects with no prerequisites map to an empty array.
  async getPrerequisitesWithGradesForSubjects(
    subject_ids: string[],
    student_id: string,
    org_id: string,
  ): Promise<
    Map<
      string,
      Array<{ subject_id: string; subject_name: string; grade: unknown }>
    >
  > {
    const uniqueIds = [...new Set(subject_ids)];
    const grouped = new Map<
      string,
      Array<{ subject_id: string; subject_name: string; grade: unknown }>
    >();
    if (uniqueIds.length === 0) return grouped;

    const prereqs = await this.db.subjectPrerequisite.findMany({
      where: { subject_id: { in: uniqueIds }, org_id },
      include: {
        prerequisite: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (prereqs.length === 0) return grouped;

    const prerequisiteSubjectIds = [
      ...new Set(prereqs.map((p) => p.prerequisite_id)),
    ];

    const grades = await this.db.grade.findMany({
      where: {
        org_id,
        student_id,
        is_locked: true,
        class: {
          subject_id: { in: prerequisiteSubjectIds },
        },
      },
      orderBy: [
        { class: { schoolYear: { start_date: 'asc' } } },
        { id: 'asc' },
      ],
      include: {
        class: {
          select: { id: true, subject_id: true, school_year_id: true },
        },
      },
    });

    const gradesBySubject = new Map<string, typeof grades>();
    for (const grade of grades) {
      const list = gradesBySubject.get(grade.class.subject_id);
      if (list) list.push(grade);
      else gradesBySubject.set(grade.class.subject_id, [grade]);
    }

    for (const p of prereqs) {
      const matches = gradesBySubject.get(p.prerequisite_id) ?? [];
      const row = {
        subject_id: p.prerequisite_id,
        subject_name: p.prerequisite.name,
        grade: matches.length > 0 ? matches[matches.length - 1] : null,
      };
      const list = grouped.get(p.subject_id);
      if (list) list.push(row);
      else grouped.set(p.subject_id, [row]);
    }

    return grouped;
  }
}
