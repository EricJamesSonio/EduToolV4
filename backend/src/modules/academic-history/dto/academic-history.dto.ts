import { IsOptional, IsString, IsIn } from 'class-validator';

export class TimelineQueryDto {
  @IsOptional()
  @IsString()
  schoolYearId?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'asc';
}

export type TimelineEventType =
  | 'academic_enrollment_created'
  | 'program_enrollment_created'
  | 'section_assigned'
  | 'class_enrolled'
  | 'outcome_set'
  | 'program_shift'
  | 'assignment_request_created'
  | 'assignment_request_finalized'
  | 'assignment_request_reopened';

export interface TimelineEvent {
  type: TimelineEventType;
  timestamp: string;
  schoolYearId: string;
  data: Record<string, unknown>;
}

export interface FullHistorySchoolYear {
  studentSchoolYearId: string;
  schoolYear: { id: string; name: string; status: string };
  enrolledAt: string;
  programEnrollments: {
    id: string;
    program: { id: string; name: string; type: string };
    status: string;
    enrolledAt: string;
    sectionAssignedAt: string | null;
    section: { id: string; name: string } | null;
    endReason: string | null;
    endedAt: string | null;
    shiftFromEvent?: unknown;
    shiftToEvent?: unknown;
  }[];
  enrollments: {
    id: string;
    class: { id: string; subjectName: string; educatorName: string | null };
    status: string;
    outcome: string | null;
    createdAt: string;
    outcomeSetAt: string | null;
  }[];
  shiftEvents: unknown[];
  requests: unknown[];
}
