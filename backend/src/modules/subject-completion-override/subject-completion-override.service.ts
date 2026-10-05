import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { AuditLogService } from '../audit-log/audit-log.service';
import { GradingScaleRepository } from '../grading-scale/grading-scale.repository';

const FALLBACK_PASSING_SCORE = 75;
import {
  CreateSubjectCompletionDto,
  UpdateSubjectCompletionDto,
} from './dto/subject-completion-override.dto';

@Injectable()
export class SubjectCompletionOverrideService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
    private readonly gradingScaleRepository: GradingScaleRepository,
  ) {}

  async list(orgId: string, studentId: string) {
    return this.db.subjectCompletionOverride.findMany({
      where: { org_id: orgId, student_id: studentId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            year_level: true,
            term_label: true,
            program_id: true,
            course_id: true,
            strand_id: true,
            level_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async completedSubjectIds(orgId: string, studentId: string): Promise<Set<string>> {
    const rows = await this.db.subjectCompletionOverride.findMany({
      where: { org_id: orgId, student_id: studentId, status: 'completed' },
      select: { subject_id: true },
    });
    return new Set(rows.map((r) => r.subject_id));
  }

  /**
   * Batched per-student status map for hierarchy overlay. 3 queries max:
   * overrides + locked grades (with class->subject) + batched grading scales.
   * completed = override completed OR locked passing grade.
   */
  async statuses(orgId: string, studentId: string, subjectIds: string[]) {
    const uniqueIds = [...new Set(subjectIds)].slice(0, 1000);
    if (uniqueIds.length === 0) return {};

    const [overrides, grades] = await Promise.all([
      this.db.subjectCompletionOverride.findMany({
        where: { org_id: orgId, student_id: studentId, subject_id: { in: uniqueIds } },
        select: { subject_id: true, status: true },
      }),
      this.db.grade.findMany({
        where: {
          org_id: orgId,
          student_id: studentId,
          is_locked: true,
          class: { subject_id: { in: uniqueIds } },
        },
        select: {
          final_score: true,
          class: { select: { id: true, subject_id: true } },
        },
      }),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.subject_id, o.status]));
    // Latest grade per subject wins — order is insertion order; group max score.
    const bestGrade = new Map<string, { final_score: number; class_id: string }>();
    for (const g of grades) {
      const sid = (g.class as unknown as { subject_id: string }).subject_id;
      const prev = bestGrade.get(sid);
      if (!prev || g.final_score > prev.final_score) {
        bestGrade.set(sid, {
          final_score: g.final_score,
          class_id: (g.class as unknown as { id: string }).id,
        });
      }
    }

    const classIds = [...new Set([...bestGrade.values()].map((g) => g.class_id))];
    const scales = classIds.length
      ? await this.gradingScaleRepository.findByClassIds(classIds, orgId).catch(() => new Map())
      : new Map<string, unknown>();

    const result: Record<string, { status: string; source: string }> = {};
    for (const sid of uniqueIds) {
      if (overrideMap.get(sid) === 'completed') {
        result[sid] = { status: 'completed', source: 'override' };
        continue;
      }
      const grade = bestGrade.get(sid);
      if (grade) {
        const passing = this.isPassing(
          grade.final_score,
          scales.get(grade.class_id) as
            | { ranges?: Array<{ minPercent: number; maxPercent: number; isPassing: boolean }> }
            | undefined,
        );
        if (passing) {
          result[sid] = { status: 'completed', source: 'grade' };
          continue;
        }
      }
      result[sid] = {
        status: overrideMap.get(sid) === 'pending' ? 'pending' : 'none',
        source: 'none',
      };
    }
    return result;
  }

  private isPassing(
    finalScore: number,
    scale?: { ranges?: Array<{ minPercent: number; maxPercent: number; isPassing: boolean }> },
  ): boolean {
    try {
      const ranges = scale?.ranges;
      if (ranges) {
        const rounded = Math.round(finalScore);
        const match = ranges.find((r) => rounded >= r.minPercent && rounded <= r.maxPercent);
        if (match) return !!match.isPassing;
      }
    } catch {
      // fall through to fallback
    }
    return finalScore >= FALLBACK_PASSING_SCORE;
  }

  async upsert(
    orgId: string,
    studentId: string,
    actorId: string,
    dto: CreateSubjectCompletionDto,
  ) {
    const subject = await this.db.subject.findFirst({
      where: { id: dto.subjectId, org_id: orgId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!subject) throw new NotFoundException('Subject not found.');

    const row = await this.db.subjectCompletionOverride.upsert({
      where: {
        org_id_student_id_subject_id: {
          org_id: orgId,
          student_id: studentId,
          subject_id: dto.subjectId,
        },
      },
      create: {
        org_id: orgId,
        student_id: studentId,
        subject_id: dto.subjectId,
        status: 'completed',
        reason: dto.reason ?? null,
        actor_id: actorId,
      },
      update: {
        status: 'completed',
        reason: dto.reason ?? null,
        actor_id: actorId,
      },
      include: { subject: { select: { id: true, name: true } } },
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'subject_completion_mark_completed',
        entityType: 'subject_completion_override',
        entityId: row.id,
        metadata: { studentId, subjectId: dto.subjectId },
      })
      .catch(() => {});
    return row;
  }

  async updateStatus(
    orgId: string,
    overrideId: string,
    actorId: string,
    dto: UpdateSubjectCompletionDto,
  ) {
    const existing = await this.db.subjectCompletionOverride.findFirst({
      where: { id: overrideId, org_id: orgId },
    });
    if (!existing) throw new NotFoundException('Completion record not found.');

    const row = await this.db.subjectCompletionOverride.update({
      where: { id: overrideId },
      data: {
        status: dto.status,
        reason: dto.reason ?? existing.reason,
        actor_id: actorId,
      },
      include: { subject: { select: { id: true, name: true } } },
    });

    // Grandfather rule: flipping completed -> pending does NOT touch existing
    // dependent enrollments. Only new enrollments are gated.
    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action:
          dto.status === 'completed'
            ? 'subject_completion_mark_completed'
            : 'subject_completion_mark_pending',
        entityType: 'subject_completion_override',
        entityId: row.id,
        metadata: { studentId: row.student_id, subjectId: row.subject_id },
      })
      .catch(() => {});
    return row;
  }

  async remove(
    orgId: string,
    overrideId: string,
    actorId: string,
    removeDependentEnrollments = false,
  ) {
    const existing = await this.db.subjectCompletionOverride.findFirst({
      where: { id: overrideId, org_id: orgId },
    });
    if (!existing) throw new NotFoundException('Completion record not found.');

    if (removeDependentEnrollments) {
      // Find subjects that list this subject as a prerequisite, then remove
      // the student's active enrollments in classes of those subjects.
      const dependents = await this.db.subjectPrerequisite.findMany({
        where: { org_id: orgId, prerequisite_id: existing.subject_id },
        select: { subject_id: true },
      });
      const dependentSubjectIds = dependents.map((d) => d.subject_id);
      if (dependentSubjectIds.length > 0) {
        const classes = await this.db.class.findMany({
          where: { org_id: orgId, subject_id: { in: dependentSubjectIds } },
          select: { id: true },
        });
        const classIds = classes.map((c) => c.id);
        if (classIds.length > 0) {
          await this.db.enrollment.deleteMany({
            where: {
              org_id: orgId,
              student_id: existing.student_id,
              class_id: { in: classIds },
              status: 'active',
            },
          });
        }
      }
    }

    await this.db.subjectCompletionOverride.delete({ where: { id: overrideId } });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'subject_completion_abort',
        entityType: 'subject_completion_override',
        entityId: overrideId,
        metadata: {
          studentId: existing.student_id,
          subjectId: existing.subject_id,
          removeDependentEnrollments,
        },
      })
      .catch(() => {});
    return { deleted: true };
  }

  async catalog(orgId: string, search?: string, take = 100) {
    if (!search || search.trim().length === 0) {
      return this.db.subject.findMany({
        where: { org_id: orgId, deleted_at: null },
        select: {
          id: true,
          name: true,
          year_level: true,
          term_label: true,
          program_id: true,
          course_id: true,
          strand_id: true,
          level_id: true,
        },
        orderBy: { name: 'asc' },
        take: Math.min(Math.max(take, 1), 200),
      });
    }
    const q = search.trim();
    return this.db.subject.findMany({
      where: { org_id: orgId, deleted_at: null, name: { contains: q, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        year_level: true,
        term_label: true,
        program_id: true,
        course_id: true,
        strand_id: true,
        level_id: true,
      },
      orderBy: { name: 'asc' },
      take: Math.min(Math.max(take, 1), 200),
    });
  }
}
