import { LessonWeekStructureService } from '../lesson-week-structure.service';
import { calendarDateToUtc } from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (Step 4.5) — lesson week slots are Manila-day based.
 * October 2026 Mondays: 5, 12, 19, 26. Deterministic under every TZ.
 */
describe('lesson week structure (TICK-INFRA-017)', () => {
  function serviceWith(
    startDate: Date,
    endDate: Date,
  ) {
    const classRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'c1',
        schedules: [{ weekday: 1 }],
        subject_id: 'sub-1',
        semester_id: null,
      }),
      db: {
        subject: {
          findFirst: jest.fn().mockResolvedValue({ program_id: 'prog-1' }),
        },
        semester: { findUnique: jest.fn() },
      },
    };
    const semesterTemplateRepo = {
      findAssignmentByProgram: jest.fn().mockResolvedValue({
        template: {
          semesters: [
            {
              order_index: 0,
              name: 'Sem 1',
              terms: [{ id: 't1', name: 'Prelim', order_index: 0 }],
            },
          ],
        },
        termDates: [{ term_id: 't1', start_date: startDate, end_date: endDate }],
      }),
    };
    return new LessonWeekStructureService(classRepo as any, semesterTemplateRepo as any);
  }

  it('emits Monday UTC-midnight slots with stable week numbers', async () => {
    const service = serviceWith(
      calendarDateToUtc('2026-10-01'),
      calendarDateToUtc('2026-10-31'),
    );
    const slots = await service.getWeekStructure('c1', 'org-1');
    expect(slots.map((s) => s.date)).toEqual([
      '2026-10-05T00:00:00.000Z',
      '2026-10-12T00:00:00.000Z',
      '2026-10-19T00:00:00.000Z',
      '2026-10-26T00:00:00.000Z',
    ]);
    expect(slots.map((s) => s.globalWeek)).toEqual([1, 2, 3, 4]);
    expect(slots[0].termId).toBe('t1');
  });

  it('reads legacy 16:00Z term rows as their intended days', async () => {
    const service = serviceWith(
      new Date('2026-09-30T16:00:00.000Z'),
      new Date('2026-10-30T16:00:00.000Z'),
    );
    const slots = await service.getWeekStructure('c1', 'org-1');
    expect(slots.map((s) => s.date)).toEqual([
      '2026-10-05T00:00:00.000Z',
      '2026-10-12T00:00:00.000Z',
      '2026-10-19T00:00:00.000Z',
      '2026-10-26T00:00:00.000Z',
    ]);
  });
});
