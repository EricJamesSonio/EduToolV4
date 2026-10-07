import { EnrollmentPortalService } from '../enrollment-portal.service';
import {
  addDaysToCalendarDate,
  calendarDateToUtc,
  todayInZone,
} from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (lock_date KEEP) — the submit path enforces the lock
 * boundary in real time and never relies on the hourly sweep having run.
 * Deterministic under every process TZ.
 */
describe('enrollment submit-path lock boundary (TICK-INFRA-017)', () => {
  function periodOn(start: string, end: string, lock: string) {
    return {
      id: 'period-1',
      school_year_id: 'sy-1',
      start_date: calendarDateToUtc(start),
      end_date: calendarDateToUtc(end),
      lock_date: calendarDateToUtc(lock),
    };
  }

  function serviceWith(period: ReturnType<typeof periodOn>) {
    const repo = {
      findBySlug: jest.fn().mockResolvedValue({ id: 'org-1' }),
      findPeriodByToken: jest.fn().mockResolvedValue(period),
      emailAlreadyCommitted: jest.fn().mockResolvedValue(false),
    };
    const authService = {
      sendEnrollmentOtp: jest.fn().mockResolvedValue({ sent: true }),
    };
    const service = new EnrollmentPortalService(
      repo as any,
      authService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    return { service, repo, authService };
  }

  const dto = { email: 'applicant@example.com' } as never;

  it('accepts OTP requests on the lock day itself', async () => {
    const today = todayInZone();
    const { service, authService } = serviceWith(
      periodOn(
        addDaysToCalendarDate(today, -10),
        addDaysToCalendarDate(today, 10),
        today,
      ),
    );
    await service.sendOtp('slug', 'token', dto);
    expect(authService.sendEnrollmentOtp).toHaveBeenCalledTimes(1);
  });

  it('rejects the day after the lock day without waiting for the sweep', async () => {
    const today = todayInZone();
    const { service, authService } = serviceWith(
      periodOn(
        addDaysToCalendarDate(today, -10),
        addDaysToCalendarDate(today, 10),
        addDaysToCalendarDate(today, -1),
      ),
    );
    await expect(service.sendOtp('slug', 'token', dto)).rejects.toThrow(
      /locked for review/,
    );
    expect(authService.sendEnrollmentOtp).not.toHaveBeenCalled();
  });

  it('still honors the start/end window', async () => {
    const today = todayInZone();
    const upcoming = serviceWith(
      periodOn(
        addDaysToCalendarDate(today, 1),
        addDaysToCalendarDate(today, 10),
        addDaysToCalendarDate(today, 9),
      ),
    );
    await expect(upcoming.service.sendOtp('slug', 'token', dto)).rejects.toThrow(
      /not started/,
    );

    const ended = serviceWith(
      periodOn(
        addDaysToCalendarDate(today, -10),
        addDaysToCalendarDate(today, -1),
        addDaysToCalendarDate(today, -2),
      ),
    );
    await expect(ended.service.sendOtp('slug', 'token', dto)).rejects.toThrow(
      /already closed/,
    );
  });
});
