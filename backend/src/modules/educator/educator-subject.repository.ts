import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

export interface TeachableSubjectRow {
  id: string;
  name: string;
  programId: string | null;
  programName: string | null;
  programType: string | null;
  levelId: string | null;
  levelName: string | null;
  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;
}

@Injectable()
export class EducatorSubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  /** Subjects linked to one educator, with display context. */
  findByEducator(orgId: string, educatorId: string) {
    return this.db.educatorSubject.findMany({
      where: { org_id: orgId, educator_id: educatorId },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            program_id: true,
            level_id: true,
            course_id: true,
            strand_id: true,
            program: { select: { name: true, type: true } },
            // Level/Course/Strand are soft-deleted, so an archived parent must
            // not surface as a live teaching option.
            level: { select: { name: true, deleted_at: true } },
            course: { select: { name: true, deleted_at: true } },
            strand: { select: { name: true, deleted_at: true } },
          },
        },
      },
      orderBy: { subject: { name: 'asc' } },
    });
  }

  /** Raw subject ids for one educator. Used by the eligibility assertions. */
  findSubjectIds(orgId: string, educatorId: string): Promise<string[]> {
    return this.db.educatorSubject
      .findMany({
        where: { org_id: orgId, educator_id: educatorId },
        select: { subject_id: true },
      })
      .then((rows) => rows.map((r) => r.subject_id));
  }

  /**
   * Replaces the educator's whole set in one transaction, so a partial set is
   * never observable. `skipDuplicates` makes this safe against a subject that
   * is already linked.
   */
  async replaceSet(
    orgId: string,
    educatorId: string,
    subjectIds: string[],
  ): Promise<number> {
    return this.db.$transaction(async (tx) => {
      await tx.educatorSubject.deleteMany({
        where: { org_id: orgId, educator_id: educatorId },
      });
      if (subjectIds.length === 0) return 0;
      const created = await tx.educatorSubject.createMany({
        data: subjectIds.map((subject_id) => ({
          org_id: orgId,
          educator_id: educatorId,
          subject_id,
        })),
        skipDuplicates: true,
      });
      return created.count;
    });
  }

  /** Adds links without clearing existing ones (carry-over). */
  addMany(
    orgId: string,
    educatorId: string,
    subjectIds: string[],
  ): Promise<{ count: number }> {
    return this.db.educatorSubject.createMany({
      data: subjectIds.map((subject_id) => ({
        org_id: orgId,
        educator_id: educatorId,
        subject_id,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Bulk lookup for the generator: which educators may teach each subject.
   * ONE query for the whole scope — the alternative is an N+1 per subject.
   *
   * Suspended/dropped/soft-deleted educators are excluded here so they can
   * never be auto-assigned, even though their links are retained.
   */
  async getEligibleEducatorsBySubject(
    orgId: string,
    subjectIds: string[],
  ): Promise<Map<string, string[]>> {
    const out = new Map<string, string[]>();
    if (subjectIds.length === 0) return out;

    const rows = await this.db.educatorSubject.findMany({
      where: {
        org_id: orgId,
        subject_id: { in: subjectIds },
        // Prisma 5 relation filters use the `is:` form for to-one relations.
        educator: {
          is: { role: 'educator', status: 'active', deleted_at: null },
        },
      },
      select: { subject_id: true, educator_id: true },
    });

    for (const r of rows) {
      const list = out.get(r.subject_id);
      if (list) list.push(r.educator_id);
      else out.set(r.subject_id, [r.educator_id]);
    }
    return out;
  }

  /**
   * Educators who can teach one subject. Used by manual class create.
   *
   * The public educator code (EDU-XXXX) lives in `Profile.metadata`, a JSON
   * blob, so it is read defensively rather than selected as a column.
   */
  findEducatorsForSubject(orgId: string, subjectId: string) {
    return this.db.educatorSubject.findMany({
      where: {
        org_id: orgId,
        subject_id: subjectId,
        educator: { is: { role: 'educator', deleted_at: null } },
      },
      select: {
        educator: {
          select: {
            id: true,
            status: true,
            profile: { select: { full_name: true, metadata: true } },
          },
        },
      },
    });
  }

  /** Confirms the educator is a live educator account in this org. */
  async assertEducator(orgId: string, educatorId: string): Promise<void> {
    const acc = await this.db.account.findFirst({
      where: { id: educatorId, org_id: orgId, role: 'educator', deleted_at: null },
      select: { id: true },
    });
    if (!acc) throw new NotFoundException('Educator not found.');
  }

  /**
   * Validates that every id is a Subject in this org. Returns the number of
   * distinct ids given, so the caller can detect duplicates itself.
   */
  async assertSubjectsInOrg(
    orgId: string,
    subjectIds: string[],
  ): Promise<void> {
    if (subjectIds.length === 0) return;
    const count = await this.db.subject.count({
      where: { org_id: orgId, id: { in: subjectIds } },
    });
    if (count !== new Set(subjectIds).size) {
      throw new NotFoundException(
        'One or more selected subjects do not exist in this organization.',
      );
    }
  }
}
