import * as fs from 'fs';
import * as path from 'path';
import { AcademicHistoryStudentController } from '../academic-history-student.controller';
import { AcademicHistoryService } from '../../academic-history.service';

describe('Phase 5 — Student sanitized view, self-only + no UUID leak', () => {
  let controller: AcademicHistoryStudentController;
  let service: jest.Mocked<AcademicHistoryService>;

  beforeEach(() => {
    service = {
      getFullHistory: jest.fn().mockResolvedValue([
        {
          studentSchoolYearId: 'ssy-1',
          schoolYear: { id: 'sy-1', name: '2026-2027', status: 'active' },
          programEnrollments: [
            {
              id: 'pe-1',
              program: { id: 'prog-1', name: 'BSCS' },
              status: 'ended',
              end_reason: 'shifted',
              ended_by: 'admin-uuid-123', // should be stripped
              enrolled_at: new Date().toISOString(),
            } as never,
          ],
          enrollments: [
            {
              id: 'enr-1',
              outcome: 'dropped',
              outcome_set_by: 'actor-uuid-456', // should be stripped
              shiftEventId: 'shift-uuid-789', // should be stripped? keep? we strip shiftEventId per mapper
            } as never,
          ],
          shiftEvents: [
            { id: 'shift-1', actor_id: 'actor-uuid-999' } as never,
          ],
          requests: [
            { id: 'req-1', finalized_by: 'admin-uuid-000' } as never,
          ],
        } as never,
      ]),
      getTimeline: jest.fn().mockResolvedValue([
        {
          type: 'outcome_set',
          timestamp: new Date().toISOString(),
          schoolYearId: 'sy-1',
          data: { outcome: 'dropped', outcomeSetBy: 'actor-uuid-456', actorId: 'actor-uuid-456' },
        } as never,
      ]),
    } as unknown as jest.Mocked<AcademicHistoryService>;

    controller = new AcademicHistoryStudentController(service);
  });

  it('self-only: uses @CurrentUser id, not a param — cannot query other student', async () => {
    // Controller signature is getMyHistory(@CurrentUser('id') studentId, @CurrentUser('org_id') orgId)
    // There is no @Param('studentId') — verify by calling with student A vs student B
    await controller.getMyHistory('stu-A', 'org-1');
    expect(service.getFullHistory).toHaveBeenCalledWith('stu-A', 'org-1');

    jest.clearAllMocks();
    await controller.getMyHistory('stu-B', 'org-1');
    expect(service.getFullHistory).toHaveBeenCalledWith('stu-B', 'org-1');
  });

  it('sanitizes full history: no ended_by / outcome_set_by / actor_id / finalized_by leak', async () => {
    const result = await controller.getMyHistory('stu-1', 'org-1') as unknown[];

    const first = result[0] as Record<string, unknown>;
    const pe = (first.programEnrollments as Record<string, unknown>[])[0];
    expect(pe).not.toHaveProperty('ended_by');
    expect(pe).toHaveProperty('end_reason', 'shifted'); // human-readable kept

    const enr = (first.enrollments as Record<string, unknown>[])[0];
    expect(enr).not.toHaveProperty('outcome_set_by');
    expect(enr).not.toHaveProperty('shiftEventId');
    expect(enr).toHaveProperty('outcome', 'dropped');

    const shift = (first.shiftEvents as Record<string, unknown>[])[0];
    expect(shift).not.toHaveProperty('actor_id');

    const req = (first.requests as Record<string, unknown>[])[0];
    expect(req).not.toHaveProperty('finalized_by');
  });

  it('sanitizes timeline: no actorId/outcomeSetBy leak, keeps milestone data', async () => {
    const timeline = await controller.getMyTimeline('stu-1', 'org-1', 'sy-1', 'asc');
    const evt = timeline[0] as Record<string, unknown>;
    const data = evt.data as Record<string, unknown>;
    expect(data).not.toHaveProperty('actorId');
    expect(data).not.toHaveProperty('outcomeSetBy');
    expect(data).toHaveProperty('outcome', 'dropped');
  });

  it('timeline route is strictly self-scoped — no studentId param exists to manipulate', () => {
    const controllerSource = fs.readFileSync(
      path.join(__dirname, '..', 'academic-history-student.controller.ts'),
      'utf8',
    );
    expect(controllerSource).not.toMatch(/@Param\(['"]studentId['"]\)/);
    expect(controllerSource).toMatch(/@CurrentUser\(['"]id['"]\)/);
  });
});
