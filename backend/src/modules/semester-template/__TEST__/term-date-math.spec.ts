import { validate } from 'class-validator';
import { SemesterTemplateService } from '../semester-template.service';
import { TermDateDto } from '../dto/semester-template.dto';

/**
 * TICK-INFRA-017 (Step 4.4) — template term defaults are calendar days.
 * Deterministic under every process TZ.
 */
describe('semester-template term dates (TICK-INFRA-017)', () => {
  async function errorsFor(dto: object): Promise<string[]> {
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('TermDateDto accepts YYYY-MM-DD, rejects datetimes', async () => {
    const ok = new TermDateDto();
    ok.termId = '11111111-1111-4111-8111-111111111111';
    ok.startDate = '2026-08-01';
    ok.endDate = '2026-10-31';
    expect(await errorsFor(ok)).toHaveLength(0);

    const datetime = new TermDateDto();
    datetime.termId = '11111111-1111-4111-8111-111111111111';
    datetime.startDate = '2026-08-01T00:00:00.000Z';
    datetime.endDate = '2026-10-31';
    expect(await errorsFor(datetime)).not.toHaveLength(0);
  });

  describe('computeDefaultTermDates', () => {
    function serviceWith(breaks: Array<{ label: string; start_date: Date; end_date: Date }>) {
      const repo = { findById: jest.fn() };
      const programRepo = {
        findById: jest.fn().mockResolvedValue({
          id: 'prog-1',
          school_year_id: 'sy-1',
        }),
      };
      const db = {
        programCalendar: { findFirst: jest.fn().mockResolvedValue({ breaks }) },
      };
      const service = new SemesterTemplateService(
        repo as any,
        programRepo as any,
        db as any,
      );
      return { service, repo };
    }

    const template = {
      id: 'tpl-1',
      name: 'Regular',
      semesters: [
        { terms: [{ id: 'term-1' }, { id: 'term-2' }] },
      ],
    };

    it('returns exact day strings for UTC-midnight break rows', async () => {
      const { service, repo } = serviceWith([
        {
          label: 'Sem 1',
          start_date: new Date('2026-08-01T00:00:00.000Z'),
          end_date: new Date('2026-10-31T00:00:00.000Z'),
        },
      ]);
      repo.findById.mockResolvedValue(template);

      const result = await service.computeDefaultTermDates(
        'org-1',
        'prog-1',
        'tpl-1',
      );
      expect(result).toEqual([
        { termId: 'term-1', startDate: '2026-08-01', endDate: '2026-09-15' },
        { termId: 'term-2', startDate: '2026-09-16', endDate: '2026-10-31' },
      ]);
    });

    it('returns the same days for legacy 16:00Z break rows', async () => {
      const { service, repo } = serviceWith([
        {
          label: 'Sem 1',
          start_date: new Date('2026-07-31T16:00:00.000Z'),
          end_date: new Date('2026-10-30T16:00:00.000Z'),
        },
      ]);
      repo.findById.mockResolvedValue(template);

      const result = await service.computeDefaultTermDates(
        'org-1',
        'prog-1',
        'tpl-1',
      );
      expect(result).toEqual([
        { termId: 'term-1', startDate: '2026-08-01', endDate: '2026-09-15' },
        { termId: 'term-2', startDate: '2026-09-16', endDate: '2026-10-31' },
      ]);
    });
  });
});
