import {
  getScheduleViolation,
  isActiveWeekday,
  findBreakOverlap,
  getFreeMinuteRanges,
  toMinutes,
  type ScheduleWindow,
} from '../schedule-window.util';

const base: ScheduleWindow = {
  startTime: '07:00',
  endTime: '17:00',
  slotDuration: 30,
};

describe('getScheduleViolation — existing window rules (regression)', () => {
  it('rejects a range outside the window', () => {
    expect(getScheduleViolation(base, 6 * 60, 7 * 60)).toMatch(/outside allowed range/);
  });

  it('rejects a duration that is not a multiple of the slot', () => {
    expect(getScheduleViolation(base, 8 * 60, 8 * 60 + 45)).toMatch(/must be a multiple of 30m/);
  });

  it('rejects a start that is not slot-aligned', () => {
    // Duration is a clean 30m so the alignment rule is what fires, not the
    // duration rule (checked first).
    expect(getScheduleViolation(base, 8 * 60 + 15, 8 * 60 + 45)).toMatch(
      /align to 30m slots/,
    );
  });

  it('accepts a valid in-window aligned range', () => {
    expect(getScheduleViolation(base, 8 * 60, 9 * 60)).toBeNull();
  });

  it('ignores the weekday when the window declares no active weekdays', () => {
    expect(getScheduleViolation(base, 8 * 60, 9 * 60, 0)).toBeNull();
  });
});

describe('active weekdays', () => {
  const w: ScheduleWindow = { ...base, activeWeekdays: [1, 2, 3, 4, 5] };

  it('accepts an active weekday', () => {
    expect(getScheduleViolation(w, 8 * 60, 9 * 60, 1)).toBeNull();
  });

  it('rejects an inactive weekday and names it', () => {
    expect(getScheduleViolation(w, 8 * 60, 9 * 60, 0)).toMatch(/does not hold classes on Sunday/);
    expect(getScheduleViolation(w, 8 * 60, 9 * 60, 6)).toMatch(/does not hold classes on Saturday/);
  });

  it('treats every day as active when the list is empty (rule not configured)', () => {
    const unconfigured: ScheduleWindow = { ...base, activeWeekdays: [] };
    expect(isActiveWeekday(unconfigured, 3)).toBe(true);
  });

  it('treats every day as active when the list is absent', () => {
    expect(isActiveWeekday(base, 6)).toBe(true);
  });
});

describe('breaks', () => {
  const w: ScheduleWindow = {
    ...base,
    breaks: [{ label: 'Lunch', start: '12:00', end: '13:00' }],
  };

  it('rejects a range fully inside a break', () => {
    expect(getScheduleViolation(w, 12 * 60, 13 * 60)).toMatch(/overlaps the Lunch break/);
  });

  it('rejects a range that straddles the start of a break', () => {
    expect(getScheduleViolation(w, 11 * 60 + 30, 12 * 60 + 30)).toMatch(/overlaps the Lunch break/);
  });

  it('rejects a range that straddles the end of a break', () => {
    expect(getScheduleViolation(w, 12 * 60 + 30, 13 * 60 + 30)).toMatch(/overlaps the Lunch break/);
  });

  it('allows a range that ends exactly when the break starts', () => {
    expect(getScheduleViolation(w, 11 * 60, 12 * 60)).toBeNull();
  });

  it('allows a range that starts exactly when the break ends', () => {
    expect(getScheduleViolation(w, 13 * 60, 14 * 60)).toBeNull();
  });

  it('finds the overlapping break by label', () => {
    expect(findBreakOverlap(w, 12 * 60, 13 * 60)?.label).toBe('Lunch');
    expect(findBreakOverlap(w, 8 * 60, 9 * 60)).toBeNull();
  });
});

describe('getFreeMinuteRanges', () => {
  it('returns the whole window when there are no breaks', () => {
    expect(getFreeMinuteRanges(base)).toEqual([{ startMin: 420, endMin: 1020 }]);
  });

  it('splits the window around a break', () => {
    const w: ScheduleWindow = { ...base, breaks: [{ label: 'Lunch', start: '12:00', end: '13:00' }] };
    expect(getFreeMinuteRanges(w)).toEqual([
      { startMin: 420, endMin: 720 },
      { startMin: 780, endMin: 1020 },
    ]);
  });

  it('handles multiple breaks in any input order', () => {
    const w: ScheduleWindow = {
      ...base,
      breaks: [
        { label: 'Lunch', start: '12:00', end: '13:00' },
        { label: 'Recess', start: '10:00', end: '10:20' },
      ],
    };
    expect(getFreeMinuteRanges(w)).toEqual([
      { startMin: 420, endMin: 600 },
      { startMin: 620, endMin: 720 },
      { startMin: 780, endMin: 1020 },
    ]);
  });

  it('collapses overlapping breaks rather than emitting a negative range', () => {
    const w: ScheduleWindow = {
      ...base,
      breaks: [
        { label: 'A', start: '12:00', end: '13:00' },
        { label: 'B', start: '12:30', end: '13:30' },
      ],
    };
    expect(getFreeMinuteRanges(w)).toEqual([
      { startMin: 420, endMin: 720 },
      { startMin: 810, endMin: 1020 },
    ]);
  });
});

describe('toMinutes', () => {
  it('converts HH:mm to minutes-of-day', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('07:30')).toBe(450);
    expect(toMinutes('23:59')).toBe(1439);
  });
});