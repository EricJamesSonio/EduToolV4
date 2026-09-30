import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  EducatorSubjectRepository,
  type TeachableSubjectRow,
} from './educator-subject.repository';
import { AuditLogService } from '../audit-log/audit-log.service';

/** Case/whitespace-insensitive comparison key. */
const norm = (s: string): string => s.trim().toLowerCase();

/**
 * Reads the public educator code out of `Profile.metadata`.
 *
 * That code is stored in a JSON blob, so it must be read defensively: the
 * value may be absent, and Prisma types it as `JsonValue`, not `string`.
 */
function readEducatorCode(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const code = (metadata as Record<string, unknown>).educatorId;
  return typeof code === 'string' ? code : null;
}

interface CarrySubject {
  id: string;
  name: string;
  programType: string;
  levelName: string | null;
  courseName: string | null;
  strandName: string | null;
}

@Injectable()
export class EducatorSubjectService {
  constructor(
    private readonly repo: EducatorSubjectRepository,
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private static map(rows: any[]): TeachableSubjectRow[] {
    return rows.map((r) => {
      const s = r.subject;
      return {
        id: s.id,
        name: s.name,
        programId: s.program_id,
        programName: s.program?.name ?? null,
        programType: s.program?.type ?? null,
        levelId: s.level_id,
        // An archived parent renders as no context rather than as a live one.
        levelName: s.level?.deleted_at ? null : (s.level?.name ?? null),
        courseId: s.course_id,
        courseName: s.course?.deleted_at ? null : (s.course?.name ?? null),
        strandId: s.strand_id,
        strandName: s.strand?.deleted_at ? null : (s.strand?.name ?? null),
      };
    });
  }

  /** GET /educators/:id/subjects */
  async listForEducator(orgId: string, educatorId: string) {
    await this.repo.assertEducator(orgId, educatorId);
    return EducatorSubjectService.map(
      await this.repo.findByEducator(orgId, educatorId),
    );
  }

  /** PUT /educators/:id/subjects — replaces the whole set. */
  async replaceSet(
    orgId: string,
    educatorId: string,
    subjectIds: string[],
    actorId: string,
  ) {
    await this.repo.assertEducator(orgId, educatorId);

    const unique = [...new Set(subjectIds)];
    // Tenant isolation: every subject must belong to THIS org.
    await this.repo.assertSubjectsInOrg(orgId, unique);

    const count = await this.repo.replaceSet(orgId, educatorId, unique);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subjects_replaced',
        entityType: 'educator',
        entityId: educatorId,
        metadata: { count },
      })
      .catch(() => {});

    return { count };
  }

  /** GET /subjects/:id/educators — who can teach this subject. */
  async listEducatorsForSubject(orgId: string, subjectId: string) {
    const rows = await this.repo.findEducatorsForSubject(orgId, subjectId);
    return rows.map((r) => ({
      id: r.educator.id,
      status: r.educator.status,
      fullName: r.educator.profile?.full_name ?? null,
      // The public educator code lives in the Profile metadata JSON blob.
      educatorId: readEducatorCode(r.educator.profile?.metadata),
    }));
  }

  /** True when the educator may teach the subject (has a link). */
  async canTeach(orgId: string, educatorId: string, subjectId: string) {
    const ids = await this.repo.findSubjectIds(orgId, educatorId);
    return ids.includes(subjectId);
  }

  /**
   * Copies teachable subjects from one school year to another.
   *
   * Subjects are recreated per year, so ids never carry over. Each link is
   * matched on normalized name + program type + parent names (level, then
   * course/strand). Anything unmatched is REPORTED, never guessed.
   */
  async carryOver(
    orgId: string,
    fromSchoolYearId: string,
    toSchoolYearId: string,
    educatorIds: string[] | undefined,
    actorId: string,
  ) {
    if (fromSchoolYearId === toSchoolYearId) {
      throw new BadRequestException(
        'Choose a different school year to copy into.',
      );
    }

    const educatorWhere = {
      org_id: orgId,
      role: 'educator' as const,
      deleted_at: null,
      ...(educatorIds?.length ? { id: { in: educatorIds } } : {}),
    };

    // Everything for the scope is loaded up front. Doing it per educator or per
    // subject would be an N+1 across a whole school year's faculty.
    const [links, educators, fromSubjects, toSubjects] = await Promise.all([
      // Prisma 5 relation filters use the `is:` form for to-one relations.
      this.db.educatorSubject.findMany({
        where: { org_id: orgId, educator: { is: educatorWhere } },
        select: { educator_id: true, subject_id: true },
      }),
      this.db.account.findMany({
        where: educatorWhere,
        select: { id: true },
      }),
      this.subjectsInYear(orgId, fromSchoolYearId),
      this.subjectsInYear(orgId, toSchoolYearId),
    ]);

    // Build the match index for the TARGET year once.
    const targetIndex = new Map<string, string>();
    for (const s of toSubjects.values()) {
      targetIndex.set(EducatorSubjectService.subjectKey(s), s.id);
    }

    const unmatched: Array<{
      educatorId: string;
      subjectName: string;
      reason: string;
    }> = [];
    const byEducator = new Map<string, Set<string>>();

    for (const link of links) {
      const source = fromSubjects.get(link.subject_id);
      if (!source) continue; // link points outside the "from" year

      const targetId = targetIndex.get(
        EducatorSubjectService.subjectKey(source),
      );
      if (!targetId) {
        unmatched.push({
          educatorId: link.educator_id,
          subjectName: source.name,
          reason: 'No equivalent subject in the target year',
        });
        continue;
      }

      const set = byEducator.get(link.educator_id) ?? new Set<string>();
      set.add(targetId);
      byEducator.set(link.educator_id, set);
    }

    let created = 0;
    for (const [educatorId, subjectIds] of byEducator) {
      const res = await this.repo.addMany(orgId, educatorId, [...subjectIds]);
      created += res.count;
    }

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subjects_carried_over',
        entityType: 'educator',
        entityId: fromSchoolYearId,
        metadata: {
          fromSchoolYearId,
          toSchoolYearId,
          created,
          unmatched: unmatched.length,
        },
      })
      .catch(() => {});

    return { created, educatorsProcessed: educators.length, unmatched };
  }

  /**
   * All subjects belonging to one school year, keyed by id.
   *
   * A subject joins a year through whichever parent it hangs off (program,
   * level, course or strand), because `Subject` has no `school_year_id` of its
   * own. All parents load in a few batched queries, not one per parent.
   */
  private async subjectsInYear(
    orgId: string,
    schoolYearId: string,
  ): Promise<Map<string, CarrySubject>> {
    const [programs, levels, courses, strands] = await Promise.all([
      this.db.program.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId },
        select: { id: true, type: true },
      }),
      this.db.level.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, program_id: true },
      }),
      this.db.course.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, program_id: true },
      }),
      this.db.strand.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, program_id: true },
      }),
    ]);

    const programTypeById = new Map(programs.map((p) => [p.id, p.type]));

    // Each parent resolves to the program that owns it, which is what actually
    // decides the school year a subject belongs to.
    const parentProgramIds = [
      ...levels.map((l) => [l.id, l.program_id] as const),
      ...courses.map((c) => [c.id, c.program_id] as const),
      ...strands.map((s) => [s.id, s.program_id] as const),
    ];
    const programIdByParent = new Map(parentProgramIds);
    const parentProgramId = (parentId: string | null): string | null =>
      parentId ? (programIdByParent.get(parentId) ?? null) : null;

    const nameOf = (
      rows: Array<{ id: string; name: string }>,
      id: string | null,
    ): string | null => (id ? (rows.find((r) => r.id === id)?.name ?? null) : null);

    const subjects = await this.db.subject.findMany({
      where: { org_id: orgId },
      select: {
        id: true,
        name: true,
        program_id: true,
        level_id: true,
        course_id: true,
        strand_id: true,
      },
    });

    const out = new Map<string, CarrySubject>();
    for (const s of subjects) {
      const programId =
        s.program_id ??
        parentProgramId(s.level_id) ??
        parentProgramId(s.course_id) ??
        parentProgramId(s.strand_id);
      if (!programId) continue;

      const programType = programTypeById.get(programId);
      if (!programType) continue; // parent belongs to another year, or is gone

      out.set(s.id, {
        id: s.id,
        name: s.name,
        programType,
        levelName: nameOf(levels, s.level_id),
        courseName: nameOf(courses, s.course_id),
        strandName: nameOf(strands, s.strand_id),
      });
    }
    return out;
  }

  /**
   * Carry-over match key: name + program type + parent names.
   *
   * Level name is included deliberately — the same subject name exists at many
   * levels, and matching on name alone would attach the wrong one.
   */
  private static subjectKey(s: CarrySubject): string {
    return [
      norm(s.name),
      norm(s.programType),
      norm(s.levelName ?? ''),
      norm(s.courseName ?? ''),
      norm(s.strandName ?? ''),
    ].join('|');
  }
}
