import { Injectable } from '@nestjs/common';
import { AcademicHistoryRepository } from './academic-history.repository';
import { TimelineEvent } from './dto/academic-history.dto';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AcademicHistoryService {
  constructor(
    private readonly repo: AcademicHistoryRepository,
    private readonly db: DatabaseService,
  ) {}

  async getTimeline(
    studentId: string,
    orgId: string,
    schoolYearId?: string,
    sort: 'asc' | 'desc' = 'asc',
  ): Promise<TimelineEvent[]> {
    const [schoolYears, enrollments, shiftEvents, requests] = await Promise.all([
      this.repo.getStudentSchoolYears(studentId, orgId, schoolYearId),
      this.repo.getEnrollments(studentId, orgId, schoolYearId),
      this.repo.getShiftEvents(studentId, orgId, schoolYearId),
      this.repo.getClassAssignmentRequests(studentId, orgId, schoolYearId),
    ]);

    const events: TimelineEvent[] = [];

    // Maps for human-readable enrichment
    const peIdToProgram = new Map<string, string>();
    const peIdToSection = new Map<string, string | null>();
    for (const ssy of schoolYears) {
      for (const pe of ssy.programEnrollments) {
        peIdToProgram.set(pe.id, (pe.program as unknown as { name: string })?.name ?? pe.program_id);
        peIdToSection.set(pe.id, (pe.section as unknown as { name: string } | null)?.name ?? null);
      }
    }
    const ssyIdToSchoolYearId = new Map<string, string>();
    const ssyIdToSchoolYearName = new Map<string, string>();
    for (const ssy of schoolYears) {
      ssyIdToSchoolYearId.set(ssy.id, ssy.school_year_id);
      ssyIdToSchoolYearName.set(ssy.id, (ssy.schoolYear as unknown as { name: string })?.name ?? ssy.school_year_id);
    }

    for (const ssy of schoolYears) {
      const syName = (ssy.schoolYear as unknown as { name: string })?.name ?? ssy.school_year_id;
      events.push({
        type: 'academic_enrollment_created',
        timestamp: ssy.enrolled_at.toISOString(),
        schoolYearId: ssy.school_year_id,
        data: { schoolYearName: syName },
      });

      for (const pe of ssy.programEnrollments) {
        const progName = (pe.program as unknown as { name: string })?.name ?? pe.program_id;
        const levelName = (pe.level as unknown as { name: string } | null)?.name ?? null;
        const courseName = (pe.course as unknown as { name: string } | null)?.name ?? null;
        const strandName = (pe.strand as unknown as { name: string } | null)?.name ?? null;
        events.push({
          type: 'program_enrollment_created',
          timestamp: pe.enrolled_at.toISOString(),
          schoolYearId: ssy.school_year_id,
          data: { programName: progName, levelName, courseName, strandName },
        });

        if (pe.section_assigned_at) {
          const secName = (pe.section as unknown as { name: string } | null)?.name ?? pe.section_id ?? '—';
          events.push({
            type: 'section_assigned',
            timestamp: pe.section_assigned_at.toISOString(),
            schoolYearId: ssy.school_year_id,
            data: { sectionName: secName, programName: progName },
          });
        }
      }
    }

    for (const e of enrollments) {
      const subjName = (e.class as unknown as { subject: { name: string } }).subject?.name ?? 'Unknown subject';
      const syId = (e.class as unknown as { school_year_id: string }).school_year_id;
      events.push({
        type: 'class_enrolled',
        timestamp: e.created_at.toISOString(),
        schoolYearId: syId,
        data: {
          subjectName: subjName,
        },
      });
      if (e.outcome_set_at) {
        events.push({
          type: 'outcome_set',
          timestamp: e.outcome_set_at.toISOString(),
          schoolYearId: syId,
          data: {
            subjectName: subjName,
            outcome: e.outcome,
            outcomeReason: e.outcome_reason,
          },
        });
      }
    }

    for (const s of shiftEvents) {
      const syId = ssyIdToSchoolYearId.get(s.student_school_year_id) ?? s.student_school_year_id;
      const fromName = peIdToProgram.get(s.from_program_enrollment_id) ?? '—';
      const toName = peIdToProgram.get(s.to_program_enrollment_id) ?? '—';
      events.push({
        type: 'program_shift',
        timestamp: s.created_at.toISOString(),
        schoolYearId: syId,
        data: {
          fromProgramName: fromName,
          toProgramName: toName,
          defaultOutcomeUsed: s.default_outcome_used,
        },
      });
    }

    // Resolve subject names for request events
    const allSubjectIds = Array.from(
      new Set(
        requests.flatMap((r) => [
          ...(r.student_requested_subject_ids as string[]),
          ...(r.admin_finalized_subject_ids as string[]),
        ]),
      ),
    ).filter(Boolean) as string[];
    let subjectIdToName = new Map<string, string>();
    if (allSubjectIds.length > 0) {
      const subjects = await this.db.subject.findMany({
        where: { id: { in: allSubjectIds } },
        select: { id: true, name: true },
      });
      subjectIdToName = new Map(subjects.map((s) => [s.id, s.name]));
    }
    const toNames = (ids: string[]): string[] => ids.map((id) => subjectIdToName.get(id) ?? id.slice(0, 8));

    for (const r of requests) {
      const syId = ssyIdToSchoolYearId.get(r.student_school_year_id) ?? r.student_school_year_id;
      const requestedNames = toNames(r.student_requested_subject_ids as string[]);
      events.push({
        type: 'assignment_request_created',
        timestamp: r.requested_at.toISOString(),
        schoolYearId: syId,
        data: {
          origin: r.origin,
          status: r.status,
          subjectNames: requestedNames,
        },
      });
      if (r.finalized_at) {
        const finalizedNames = toNames(r.admin_finalized_subject_ids as string[]);
        events.push({
          type: 'assignment_request_finalized',
          timestamp: r.finalized_at.toISOString(),
          schoolYearId: syId,
          data: {
            subjectNames: finalizedNames,
          },
        });
      }
      if (r.reopen_reason && r.status === 'pending_review' && r.finalized_at === null && r.updated_at) {
        events.push({
          type: 'assignment_request_reopened',
          timestamp: r.updated_at.toISOString(),
          schoolYearId: syId,
          data: {
            reason: r.reopen_reason,
          },
        });
      }
    }

    // Filter to requested schoolYearId if provided (already scoped but double-check)
    let filtered = events;
    if (schoolYearId) {
      // For shift events we stored ssy id, need to map - keep all filtered already at repo level so just keep
      filtered = events;
    }

    filtered.sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sort === 'asc' ? diff : -diff;
    });

    return filtered;
  }

  async getFullHistory(studentId: string, orgId: string) {
    const [schoolYears, enrollments, shiftEvents, requests] = await Promise.all([
      this.repo.getStudentSchoolYears(studentId, orgId),
      this.repo.getEnrollments(studentId, orgId),
      this.repo.getShiftEvents(studentId, orgId),
      this.repo.getClassAssignmentRequests(studentId, orgId),
    ]);

    // Group enrollments by schoolYear via class.school_year_id
    const enrollmentsByYear = new Map<string, typeof enrollments>();
    for (const e of enrollments) {
      const syId = (e.class as unknown as { school_year_id: string }).school_year_id;
      if (!enrollmentsByYear.has(syId)) enrollmentsByYear.set(syId, []);
      enrollmentsByYear.get(syId)!.push(e);
    }

    const shiftByYear = new Map<string, typeof shiftEvents>();
    for (const s of shiftEvents) {
      // Resolve syId via SSY id
      const ssy = schoolYears.find((x) => x.id === s.student_school_year_id);
      const syId = ssy?.school_year_id ?? 'unknown';
      if (!shiftByYear.has(syId)) shiftByYear.set(syId, []);
      shiftByYear.get(syId)!.push(s);
    }

    const requestsByYear = new Map<string, typeof requests>();
    for (const r of requests) {
      const ssy = schoolYears.find((x) => x.id === r.student_school_year_id);
      const syId = ssy?.school_year_id ?? 'unknown';
      if (!requestsByYear.has(syId)) requestsByYear.set(syId, []);
      requestsByYear.get(syId)!.push(r);
    }

    return schoolYears.map((ssy) => ({
      studentSchoolYearId: ssy.id,
      schoolYear: ssy.schoolYear,
      enrolledAt: ssy.enrolled_at.toISOString(),
      unenrolledAt: ssy.unenrolled_at ? ssy.unenrolled_at.toISOString() : null,
      programEnrollments: ssy.programEnrollments.map((pe) => ({
        id: pe.id,
        program: pe.program,
        level: pe.level,
        course: pe.course,
        strand: pe.strand,
        section: pe.section,
        status: pe.status,
        enrolledAt: pe.enrolled_at.toISOString(),
        sectionAssignedAt: pe.section_assigned_at ? pe.section_assigned_at.toISOString() : null,
        endReason: pe.end_reason,
        endedAt: pe.ended_at ? pe.ended_at.toISOString() : null,
        endedBy: pe.ended_by,
        shiftFromEvent: pe.shiftFromEvent,
        shiftToEvent: pe.shiftToEvent,
      })),
      enrollments: (enrollmentsByYear.get(ssy.school_year_id) ?? []).map((e) => ({
        id: e.id,
        status: e.status,
        outcome: e.outcome,
        outcomeReason: e.outcome_reason,
        createdAt: e.created_at.toISOString(),
        outcomeSetAt: e.outcome_set_at ? e.outcome_set_at.toISOString() : null,
        shiftEventId: e.shift_event_id,
        class: {
          id: e.class.id,
          subject: (e.class as unknown as { subject: { name: string } }).subject,
          educator: (e.class as unknown as { educator: { profile: { full_name: string } } }).educator,
        },
      })),
      shiftEvents: shiftByYear.get(ssy.school_year_id) ?? [],
      requests: requestsByYear.get(ssy.school_year_id) ?? [],
      // Maintain distinct stints: programEnrollments already includes both active and ended under same SSY
    }));
  }
}
