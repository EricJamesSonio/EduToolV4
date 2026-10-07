import { validate } from 'class-validator';
import { AcademicCalendarService } from '../academic-calendar.service';
import {
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  CalendarEventType,
} from '../dto/academic-calendar.dto';

/**
 * TICK-INFRA-017 (Step 4.4) — academic-calendar events are kind-B days.
 * Deterministic under every process TZ.
 */
describe('academic-calendar days (TICK-INFRA-017)', () => {
  async function errorsFor(dto: object): Promise<string[]> {
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('accepts YYYY-MM-DD, rejects full datetimes', async () => {
    const ok = new CreateCalendarEventDto();
    ok.schoolYearId = '11111111-1111-4111-8111-111111111111';
    ok.title = 'Holiday';
    ok.type = CalendarEventType.HOLIDAY;
    ok.startDate = '2026-12-25';
    ok.endDate = '2026-12-25';
    expect(await errorsFor(ok)).toHaveLength(0);

    const datetime = new UpdateCalendarEventDto();
    datetime.startDate = '2026-12-25T00:00:00.000Z';
    expect(await errorsFor(datetime)).not.toHaveLength(0);
  });

  describe('isBlockedDate day window', () => {
    function serviceWith(
      events: Array<{ start_date: Date; end_date: Date }>,
    ) {
      const repository = {
        findSessionBlockingEvents: jest.fn().mockResolvedValue(events),
      };
      return new AcademicCalendarService(repository as any, {
        key: jest.fn((...p: string[]) => p.join(':')),
        cached: jest.fn(
          async (_k: string, _t: number, loader: () => Promise<unknown>) =>
            loader(),
        ),
        delByPrefix: jest.fn(),
      } as any);
    }

    it('matches a day inside the window from either row convention', async () => {
      const service = serviceWith([
        {
          start_date: new Date('2026-12-25T00:00:00.000Z'),
          end_date: new Date('2026-12-25T00:00:00.000Z'),
        },
        {
          start_date: new Date('2026-12-24T16:00:00.000Z'),
          end_date: new Date('2026-12-24T16:00:00.000Z'),
        },
      ]);
      // Christmas (UTC-midnight row) and Dec-25-Manila legacy row both block
      // Dec 25, whether the session date itself is UTC- or Manila-midnight.
      for (const session of [
        new Date('2026-12-25T00:00:00.000Z'),
        new Date('2026-12-24T16:00:00.000Z'),
      ]) {
        expect(await service.isBlockedDate('org-1', 'sy-1', session)).toBe(
          true,
        );
      }
      expect(
        await service.isBlockedDate(
          'org-1',
          'sy-1',
          new Date('2026-12-26T00:00:00.000Z'),
        ),
      ).toBe(false);
    });
  });
});
