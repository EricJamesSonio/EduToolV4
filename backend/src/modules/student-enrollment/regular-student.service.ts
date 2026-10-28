import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { parseLevelRank } from '../subject-prerequisite/subject-prerequisite.utils';
import {
  RegularStudentRepository,
  REGULAR_SOURCE,
} from './regular-student.repository';

type CandidateSubject = Awaited<
  ReturnType<RegularStudentRepository['findCandidateSubjects']>
>[number];

interface StructureScope {
  courseId: string | null;
  strandId: string | null;
}

export interface SetRegularResult {
  is_regular: boolean;
  subjects_total: number;
  subjects_added: number;
  subjects_removed: number;
  kept_manual: number;
}

@Injectable()
export class RegularStudentService {
  constructor(
    private readonly repo: RegularStudentRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async setRegular(
    programEnrollmentId: string,
    orgId: string,
    actorId: string,
    isRegular: boolean,
  ): Promise<SetRegularResult> {
    const pe = await this.repo.findProgramEnrollment(
      programEnrollmentId,
      orgId,
    );
    if (!pe) throw new NotFoundException('Program enrollment not found.');

    const studentId = pe.studentSchoolYear.student_id;

    if (!isRegular) {
      const removed = await this.repo.unmarkRegular({
        programEnrollmentId,
        orgId,
        studentId,
      });

      this.auditLogService
        .logAdminAction({
          orgId,
          actorId,
          action: 'enrollment_updated',
          entityType: 'program_enrollment',
          entityId: programEnrollmentId,
          metadata: {
            studentId,
            change: 'marked_irregular',
            subjectsRemoved: removed,
          },
        })
        .catch(() => {});

      return {
        is_regular: false,
        subjects_total: 0,
        subjects_added: 0,
        subjects_removed: removed,
        kept_manual: 0,
      };
    }

    if (pe.status !== 'active') {
      throw new BadRequestException(
        'Only an active program enrollment can be marked as regular.',
      );
    }
    if (!pe.level) {
      throw new BadRequestException(
        'Assign a level to this student before marking them as regular.',
      );
    }
    if (pe.program.type === 'college' && !pe.course_id) {
      throw new BadRequestException(
        'Assign a course to this student before marking them as regular.',
      );
    }
    if (pe.program.type === 'shs' && !pe.strand_id) {
      throw new BadRequestException(
        'Assign a strand to this student before marking them as regular.',
      );
    }

    const currentRank = parseLevelRank(pe.level.name);
    if (currentRank === null) {
      throw new BadRequestException(
        `Cannot tell which year "${pe.level.name}" is, so lower years cannot be credited.`,
      );
    }

    const subjectIds = await this.resolveCreditedSubjectIds(
      orgId,
      pe.program_id,
      { courseId: pe.course_id, strandId: pe.strand_id },
      currentRank,
    );

    const existing = await this.repo.findOverrides(
      orgId,
      studentId,
      subjectIds,
    );
    const existingIds = new Set(existing.map((row) => row.subject_id));
    const keptManual = existing.filter(
      (row) => !(row.source === REGULAR_SOURCE && row.status === 'completed'),
    ).length;
    const createIds = subjectIds.filter((id) => !existingIds.has(id));

    await this.repo.markRegular({
      programEnrollmentId,
      orgId,
      studentId,
      actorId,
      keepSubjectIds: subjectIds,
      createSubjectIds: createIds,
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'enrollment_updated',
        entityType: 'program_enrollment',
        entityId: programEnrollmentId,
        metadata: {
          studentId,
          change: 'marked_regular',
          subjectsAdded: createIds.length,
          subjectsTotal: subjectIds.length,
        },
      })
      .catch(() => {});

    return {
      is_regular: true,
      subjects_total: subjectIds.length,
      subjects_added: createIds.length,
      subjects_removed: 0,
      kept_manual: keptManual,
    };
  }

  private async resolveCreditedSubjectIds(
    orgId: string,
    programId: string,
    scope: StructureScope,
    currentRank: number,
  ): Promise<string[]> {
    const candidates = await this.repo.findCandidateSubjects(
      orgId,
      programId,
    );

    const lower = new Set<string>();
    const notLower = new Set<string>();
    const current: string[] = [];

    for (const subject of candidates) {
      if (!this.isInScope(subject, scope)) continue;
      const rank = parseLevelRank(subject.level?.name ?? subject.year_level);
      if (rank === null) continue;

      if (rank < currentRank) {
        lower.add(subject.id);
      } else {
        notLower.add(subject.id);
        if (rank === currentRank) current.push(subject.id);
      }
    }

    const prerequisiteIds = await this.repo.findPrerequisiteIds(
      orgId,
      current,
    );
    const extraCandidates = prerequisiteIds.filter(
      (id) => !lower.has(id) && !notLower.has(id),
    );
    const extras = await this.repo.findActiveSubjectIds(
      orgId,
      extraCandidates,
    );

    return [...new Set([...lower, ...extras])];
  }

  private isInScope(subject: CandidateSubject, scope: StructureScope): boolean {
    const subjectCourse = subject.course_id ?? subject.level?.course_id ?? null;
    const subjectStrand = subject.strand_id ?? subject.level?.strand_id ?? null;

    const courseOk =
      !scope.courseId ||
      !subjectCourse ||
      subjectCourse === scope.courseId ||
      subject.sharings.some((s) => s.course_id === scope.courseId);

    const strandOk =
      !scope.strandId ||
      !subjectStrand ||
      subjectStrand === scope.strandId ||
      subject.sharings.some((s) => s.strand_id === scope.strandId);

    return courseOk && strandOk;
  }
}