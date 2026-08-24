import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AcademicHistoryService } from '../academic-history.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

function sanitizeFullHistory(history: unknown[]) {
  // Strip sensitive/internal fields: ended_by, outcome_set_by, actor_id, raw UUIDs where name exists
  // Keep human-readable names, dates, statuses
  return (history as Record<string, unknown>[]).map((sy) => {
    const syRec = sy as Record<string, unknown>;
    const pes = (syRec.programEnrollments as Record<string, unknown>[])?.map((pe) => {
      const { ended_by: _endedBy, ...rest } = pe as Record<string, unknown>;
      // Keep program name, not just id; section name already present
      return rest;
    });
    const enrolls = (syRec.enrollments as Record<string, unknown>[])?.map((e) => {
      const { outcome_set_by: _osb, shiftEventId: _sei, ...rest } = e as Record<string, unknown>;
      // Keep outcome string, not raw actor
      return rest;
    });
    const shifts = (syRec.shiftEvents as Record<string, unknown>[])?.map((s) => {
      const { actor_id: _actor, ...rest } = s as Record<string, unknown>;
      return rest;
    });
    const reqs = (syRec.requests as Record<string, unknown>[])?.map((r) => {
      const { finalized_by: _fb, ...rest } = r as Record<string, unknown>;
      return rest;
    });
    return { ...syRec, programEnrollments: pes, enrollments: enrolls, shiftEvents: shifts, requests: reqs };
  });
}

function sanitizeTimeline(events: { type: string; timestamp: string; schoolYearId: string; data: Record<string, unknown> }[]) {
  return events.map((e) => {
    const data = { ...e.data };
    // Strip internal actor/outcome_set_by where present
    delete (data as Record<string, unknown>).actorId;
    delete (data as Record<string, unknown>).actor_id;
    delete (data as Record<string, unknown>).outcomeSetBy;
    delete (data as Record<string, unknown>).finalizedBy;
    // Keep names, not raw ids where both exist — already human-readable in Phase 4 data (program name, subject name)
    return { ...e, data };
  });
}

@Controller('student/academic-history')
@UseGuards(AuthGuard, RolesGuard)
export class AcademicHistoryStudentController {
  constructor(private readonly service: AcademicHistoryService) {}

  @Get()
  @Roles('student')
  async getMyHistory(
    @CurrentUser('id') studentId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    const full = await this.service.getFullHistory(studentId, orgId);
    return sanitizeFullHistory(full as unknown[]);
  }

  @Get('timeline')
  @Roles('student')
  async getMyTimeline(
    @CurrentUser('id') studentId: string,
    @CurrentUser('org_id') orgId: string,
    @Query('schoolYearId') schoolYearId?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    const events = await this.service.getTimeline(studentId, orgId, schoolYearId, sort ?? 'asc');
    return sanitizeTimeline(events);
  }
}
