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
      durations: [60, 60, 60, 60, 60],
      source: 'default',
    });
  });

  it('uses college defaults for a college program', () => {
    const r = resolveSessionRequirement({}, 'college', 30);
    expect(r.sessionsPerWeek).toBe(1);
    expect(r.sessionMinutes).toBe(180);
  });

  it('uses kinder and daycare defaults', () => {
    // Both default to 60m, already a multiple of common slots.
    expect(resolveSessionRequirement({}, 'kinder', 15).sessionMinutes).toBe(60);
    expect(resolveSessionRequirement({}, 'daycare', 30).sessionMinutes).toBe(60);
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
      durations: [90, 90, 90],
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
    // Elementary default is 60m; at a 45m slot it must round up to 90m.
    expect(resolveSessionRequirement({}, 'elementary', 45).sessionMinutes).toBe(90);
    // At a 30m slot 60m is already a multiple, so no rounding.
    expect(resolveSessionRequirement({}, 'elementary', 30).sessionMinutes).toBe(60);

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

  it('expands an EMPTY durations list to a uniform one', () => {
    // The shape every pre-existing subject stores. This is the regression
    // guard: it must be indistinguishable from never having had the column.
    for (const stored of [undefined, null, []]) {
      const r = resolveSessionRequirement(
        { sessionsPerWeek: 3, sessionMinutes: 60, sessionDurations: stored },
        'elementary',
        30,
      );
      expect(r.durations).toEqual([60, 60, 60]);
      expect(r.sessionMinutes).toBe(60);
    }
  });

  it('honours per-position durations that match the count', () => {
    const r = resolveSessionRequirement(
      { sessionsPerWeek: 3, sessionMinutes: 60, sessionDurations: [60, 90, 120] },
      'elementary',
      30,
    );
    expect(r.durations).toEqual([60, 90, 120]);
    // sessionMinutes stays the resolved BASE, not a summary of the list.
    expect(r.sessionMinutes).toBe(60);
    expect(r.source).toBe('explicit');
  });

  it('treats non-empty durations as explicit even with no other field set', () => {
    const r = resolveSessionRequirement(
      { sessionsPerWeek: 2, sessionDurations: [45, 60] },
      'elementary',
      30,
    );
    expect(r.source).toBe('explicit');
    expect(r.durations).toEqual([45, 60]);
  });

  it('falls back to uniform when the stored length does not match the count', () => {
    // A corrupt row. Reshape it to uniform rather than truncate/pad, so a
    // class is never placed at a time nobody configured. The service rejects
    // such a row on save; this only decides what READERS see meanwhile.
    const short = resolveSessionRequirement(
      { sessionsPerWeek: 4, sessionMinutes: 60, sessionDurations: [60, 90] },
      'elementary',
      30,
    );
    expect(short.durations).toEqual([60, 60, 60, 60]);

    const long = resolveSessionRequirement(
      { sessionsPerWeek: 2, sessionMinutes: 60, sessionDurations: [60, 60, 60] },
      'elementary',
      30,
    );
    expect(long.durations).toEqual([60, 60]);
  });

  it('lets the department standard win over a stale, mismatched array', () => {
    // Neither the count nor the length is set, and the leftover array does not
    // match the standard's weekly count. The standard supplies the count AND
    // the lengths — a stale array must never reshape the week.
    const r = resolveSessionRequirement(
      { sessionDurations: [60, 90, 120] },
      'elementary',
      30,
    );
    expect(r.durations).toEqual([60, 60, 60, 60, 60]);
    expect(r.sessionsPerWeek).toBe(5);
    expect(r.sessionMinutes).toBe(60);
  });

  it('ignores stored durations for a subject on the default', () => {
    // The plain default case: no stored fields at all, so the department
    // standard is the only source and the resolved lengths are uniform.
    const r = resolveSessionRequirement({}, 'jhs', 30);
    expect(r.source).toBe('default');
    expect(r.durations).toEqual([120, 120, 120, 120, 120]);
  });

  it('always returns exactly sessionsPerWeek durations', () => {
    const cases = [
      {},
      { sessionsPerWeek: 1, sessionMinutes: 180 },
      { sessionsPerWeek: 7, sessionDurations: [30, 30, 60, 60, 90, 90, 120] },
      { sessionsPerWeek: 3, sessionMinutes: 45, sessionDurations: [45] },
    ];
    for (const c of cases) {
      const r = resolveSessionRequirement(c, 'elementary', 30);
      expect(r.durations).toHaveLength(r.sessionsPerWeek);
    }
  });

  it('does not alias the caller\'s array', () => {
    // The resolver's result is cached and read repeatedly; a shared reference
    // would let one caller mutate another's placement plan.
    const stored = [60, 90];
    const r = resolveSessionRequirement(
      { sessionsPerWeek: 2, sessionDurations: stored },
      'elementary',
      30,
    );
    stored[0] = 999;
    expect(r.durations[0]).toBe(60);
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