// filepath: backend/src/modules/subject/subject.mapper.ts

import { SubjectRecord, SubjectResponse } from './subject.types';

export function mapSubjectToResponse(subject: SubjectRecord): SubjectResponse {
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
    prerequisites: subject.prerequisites ?? [],
    prereqFor: subject.prereqFor ?? [],
    sharings: subject.sharings ?? [],
    createdAt: subject.created_at ?? null,
    updatedAt: subject.updated_at ?? null,
  };
}