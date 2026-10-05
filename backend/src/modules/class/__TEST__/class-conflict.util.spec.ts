import {
  slotsOverlap,
  findConflicts,
  isDayConflict,
  isBreakConflict,
  type CandidateSlot,
  type OccupiedSlot,
} from '../class-conflict.util';

const slot = (
  weekday: number,
  startMin: number,
  endMin: number,
  roomId: string | null = null,
): CandidateSlot => ({ weekday, startMin, endMin, roomId });

const booked = (over: Partial<OccupiedSlot> = {}): OccupiedSlot => ({
  classId: 'existing',
  weekday: 1,
  startMin: 8 * 60,
  endMin: 9 * 60,
  educatorId: 'ed-1',
  sectionId: 'sec-1',
  roomId: null,
  ...over,
});

describe('slotsOverlap', () => {
  it('is false on different weekdays regardless of time', () => {
    expect(slotsOverlap(slot(1, 480, 540), slot(2, 480, 540))).toBe(false);
  });

  it('is false for adjacent, non-overlapping ranges', () => {
    expect(slotsOverlap(slot(1, 480, 540), slot(1, 540, 600))).toBe(false);
    expect(slotsOverlap(slot(1, 540, 600), slot(1, 480, 540))).toBe(false);
  });

  it('is true for partial and full overlap', () => {
    expect(slotsOverlap(slot(1, 480, 540), slot(1, 510, 570))).toBe(true);
    expect(slotsOverlap(slot(1, 480, 540), slot(1, 480, 540))).toBe(true);
  });
});

describe('day rule', () => {
  it('is disabled when no active weekdays are configured', () => {
    expect(isDayConflict(slot(3, 480, 540), undefined)).toBeNull();
    expect(isDayConflict(slot(3, 480, 540), [])).toBeNull();
  });

  it('flags a day the school is closed on', () => {
    const c = isDayConflict(slot(0, 480, 540), [1, 2, 3, 4, 5]);
    expect(c?.kind).toBe('day');
    expect(c?.message).toMatch(/Sunday/);
  });
});

describe('break rule', () => {
  const breaks = [{ startMin: 720, endMin: 780, label: 'Lunch' }];

  it('flags a range inside a break', () => {
    expect(isBreakConflict(slot(1, 720, 780), breaks)?.kind).toBe('break');
  });

  it('flags a range that straddles a break edge', () => {
    expect(isBreakConflict(slot(1, 690, 750), breaks)?.kind).toBe('break');
  });

  it('allows a range that ends exactly where the break starts', () => {
    expect(isBreakConflict(slot(1, 690, 720), breaks)).toBeNull();
  });

  it('allows a range that starts exactly where the break ends', () => {
    expect(isBreakConflict(slot(1, 780, 810), breaks)).toBeNull();
  });
});

describe('findConflicts', () => {
  const ctx = { educatorId: 'ed-1', sectionId: 'sec-1' };

  it('reports nothing for a free slot', () => {
    expect(findConflicts(slot(1, 600, 660), ctx, [booked()])).toEqual([]);
  });

  it('reports the educator conflict', () => {
    const out = findConflicts(slot(1, 510, 570), ctx, [booked()]);
    expect(out.map((c) => c.kind)).toContain('educator');
  });

  it('reports the section conflict', () => {
    const out = findConflicts(slot(1, 510, 570), ctx, [booked()]);
    expect(out.map((c) => c.kind)).toContain('section');
  });

  it('reports the room conflict only when the candidate books a room', () => {
    const roomBooked = booked({ roomId: 'room-1', educatorId: 'other' });
    const withRoom = findConflicts(
      slot(1, 510, 570, 'room-1'),
      ctx,
      [roomBooked],
    );
    expect(withRoom.map((c) => c.kind)).toContain('room');

    const withoutRoom = findConflicts(slot(1, 510, 570, null), ctx, [roomBooked]);
    expect(withoutRoom.map((c) => c.kind)).not.toContain('room');
  });

  it('never reports a room conflict against a null-room booking', () => {
    const out = findConflicts(slot(1, 510, 570, 'room-1'), ctx, [
      booked({ roomId: null, educatorId: 'other' }),
    ]);
    expect(out.map((c) => c.kind)).not.toContain('room');
  });

  it('ignores the class being edited', () => {
    const out = findConflicts(
      slot(1, 510, 570),
      { ...ctx, excludeClassId: 'existing' },
      [booked()],
    );
    expect(out).toEqual([]);
  });

  it('does not report a section conflict when the class has no section', () => {
    const out = findConflicts(
      slot(1, 510, 570),
      { educatorId: 'ed-1', sectionId: null },
      [booked({ educatorId: 'other' })],
    );
    expect(out).toEqual([]);
  });

  it('returns EVERY conflict, not just the first, so the admin sees the whole picture', () => {
    const out = findConflicts(
      slot(1, 510, 570),
      ctx,
      [booked(), booked({ classId: 'second' })],
    );
    expect(out.length).toBeGreaterThan(1);
    expect(new Set(out.map((c) => c.kind))).toEqual(
      new Set(['educator', 'section']),
    );
  });

  it('surfaces day and break violations alongside booking conflicts', () => {
    const out = findConflicts(
      slot(0, 720, 780),
      {
        ...ctx,
        activeWeekdays: [1, 2, 3, 4, 5],
        blockedRanges: [{ startMin: 720, endMin: 780, label: 'Lunch' }],
      },
      [],
    );
    expect(out.map((c) => c.kind).sort()).toEqual(['break', 'day']);
  });

  it('names the other class so the message is actionable', () => {
    const out = findConflicts(slot(1, 510, 570), ctx, [booked({ classId: 'other-9' })]);
    expect(out[0].againstClassId).toBe('other-9');
  });
});