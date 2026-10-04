// filepath: backend/src/modules/subject/subject.mapper.ts

import { SubjectRecord, SubjectResponse } from './subject.types';
import { resolveSessionRequirement } from './subject-session-defaults';

/**
 * `slotMinutes` is the org's slot duration. It only affects DEFAULT resolution
 * (rounding a default up to the slot grid); an explicit value is used as-is.
 */
export function mapSubjectToResponse(
  subject: SubjectRecord,
  slotMinutes = 30,
): SubjectResponse {
  const effective = resolveSessionRequirement(
    {
      sessionsPerWeek: subject.sessions_per_week ?? null,
      sessionMinutes: subject.session_minutes ?? null,
    },
    subject.program?.type ?? null,
    slotMinutes,
  );

  return {
    id: subject.id,
    orgId: subject.org_id,
    title: subject.name,
    subjectType: subject.subject_type ?? 'major',
    programId: subject.program_id ?? null,
    programName: subject.program?.name ?? null,
    programType: subject.program?.type ?? null,
    realProgramId: subject.program_id ?? null,
    levelId: subject.level_id ?? null,
    levelName: subject.levelName ?? null,
    courseId: subject.course_id ?? null,
    courseName: subject.courseName ?? null,
    strandId: subject.strand_id ?? null,
    strandName: subject.strandName ?? null,
    lockStatus: subject.is_locked ? 'locked' : 'unlocked',
    yearLevel: subject.year_level ?? null,
    termLabel: subject.term_label ?? null,
    sessionsPerWeek: subject.sessions_per_week ?? null,
    sessionMinutes: subject.session_minutes ?? null,
    effectiveSessionsPerWeek: effective.sessionsPerWeek,
    effectiveSessionMinutes: effective.sessionMinutes,
    sessionRequirementSource: effective.source,
    prerequisites: subject.prerequisites ?? [],
    prereqFor: subject.prereqFor ?? [],
    sharings: subject.sharings ?? [],
    createdAt: subject.created_at ?? null,
    updatedAt: subject.updated_at ?? null,
  };
}