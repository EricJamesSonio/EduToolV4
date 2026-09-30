import {
  resolveSessionRequirement,
  roundUpToSlot,
  sessionMinutesOptions,
  SUBJECT_SESSION_DEFAULTS,
} from '../subject-session-defaults';

describe('resolveSessionRequirement', () => {
  it('falls back to the program-type default when nothing is set', () => {
    const r = resolveSessionRequirement({}, 'elementary', 30);
    expect(r).toEqual({
      sessionsPerWeek: 5,
      sessionMinutes: 60,
      source: 'default',
    });
  });

  it('uses college defaults for a college program', () => {
    const r = resolveSessionRequirement({}, 'college', 30);
    expect(r.sessionsPerWeek).toBe(2);
    expect(r.sessionMinutes).toBe(90);
  });

  it('uses kinder and daycare defaults', () => {
    // Kinder defaults to 45m. Use a 15m slot so this asserts the DEFAULT value
    // itself; the rounding behaviour is covered separately below.
    expect(resolveSessionRequirement({}, 'kinder', 15).sessionMinutes).toBe(45);
    expect(resolveSessionRequirement({}, 'daycare', 30).sessionMinutes).toBe(30);
  });

  it('prefers explicit values over the default', () => {
    const r = resolveSessionRequirement(
      { sessionsPerWeek: 3, sessionMinutes: 90 },
      'elementary',
      30,
    );
    expect(r).toEqual({
      sessionsPerWeek: 3,
      sessionMinutes: 90,
      source: 'explicit',
    });
  });

  it('falls back per field when only one is explicit', () => {
    const onlyCount = resolveSessionRequirement(
      { sessionsPerWeek: 2 },
      'elementary',
      30,
    );
    expect(onlyCount.sessionsPerWeek).toBe(2);
    expect(onlyCount.sessionMinutes).toBe(60); // from the default
    expect(onlyCount.source).toBe('explicit');

    const onlyMinutes = resolveSessionRequirement(
      { sessionMinutes: 45 },
      'elementary',
      30,
    );
    expect(onlyMinutes.sessionsPerWeek).toBe(5); // from the default
    expect(onlyMinutes.sessionMinutes).toBe(45);
  });

  it('rounds a DEFAULT up to the slot but never an explicit value', () => {
    // Kinder default is 45m; at a 30m slot it must round up to 60m.
    expect(resolveSessionRequirement({}, 'kinder', 30).sessionMinutes).toBe(60);
    // At a 15m slot 45m is already a multiple, so no rounding.
    expect(resolveSessionRequirement({}, 'kinder', 15).sessionMinutes).toBe(45);

    // An explicit 45 stays 45 even at a 30m slot — rounding it would hide a
    // bad row instead of surfacing it at save time.
    const explicit = resolveSessionRequirement({ sessionMinutes: 45 }, 'elementary', 30);
    expect(explicit.sessionMinutes).toBe(45);
  });

  it('uses a sane fallback for an unknown program type', () => {
    const r = resolveSessionRequirement({}, 'vocational', 30);
    expect(r.sessionsPerWeek).toBe(5);
    expect(r.sessionMinutes).toBe(60);
    expect(r.source).toBe('default');
  });

  it('treats null the same as absent', () => {
    const r = resolveSessionRequirement(
      { sessionsPerWeek: null, sessionMinutes: null },
      'shs',
      30,
    );
    expect(r.source).toBe('default');
    expect(r.sessionsPerWeek).toBe(SUBJECT_SESSION_DEFAULTS.shs.sessionsPerWeek);
  });
});

describe('roundUpToSlot', () => {
  it('rounds up to the next multiple', () => {
    expect(roundUpToSlot(45, 30)).toBe(60);
    expect(roundUpToSlot(90, 30)).toBe(90);
    expect(roundUpToSlot(91, 30)).toBe(120);
  });

  it('leaves an already-aligned value alone', () => {
    expect(roundUpToSlot(60, 30)).toBe(60);
  });

  it('is a no-op for a non-positive slot rather than dividing by zero', () => {
    expect(roundUpToSlot(45, 0)).toBe(45);
  });
});

describe('sessionMinutesOptions', () => {
  it('offers every slot multiple up to three hours', () => {
    expect(sessionMinutesOptions(30)).toEqual([30, 60, 90, 120, 150, 180]);
  });

  it('offers every multiple of a 15m slot', () => {
    expect(sessionMinutesOptions(15)).toEqual([
      15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180,
    ]);
  });
});