import {
  buildSeedPicks,
  capacityUsage,
  pickedMinutes,
} from "@/utils/educatorSlotPicks";

describe("pickedMinutes", () => {
  // Same fixtures as the backend bundle spec: s1 2x60, s-big 7x120.
  const requirements = new Map([
    ["s1", { positions: 2, minutes: 60 }],
    ["s-big", { positions: 7, minutes: 120 }],
  ]);

  test("counts section x position pairs once at session minutes", () => {
    expect(
      pickedMinutes({ s1: { "sec-1": [1, 2] } }, requirements),
    ).toBe(120);
  });

  test("dedupes repeated positions within a section", () => {
    expect(
      pickedMinutes({ s1: { "sec-1": [2, 1, 2] } }, requirements),
    ).toBe(120);
  });

  test("ignores positions outside 1..S like the server clamp", () => {
    expect(
      pickedMinutes({ s1: { "sec-1": [1, 9] } }, requirements),
    ).toBe(60);
  });

  test("ignores subjects with no known requirement", () => {
    expect(
      pickedMinutes({ ghost: { "sec-1": [1] } }, requirements),
    ).toBe(0);
  });

  test("sums across subjects", () => {
    expect(
      pickedMinutes(
        {
          s1: { "sec-1": [1, 2] },
          "s-big": { "sec-2": [1, 2, 3, 4, 5, 6, 7] },
        },
        requirements,
      ),
    ).toBe(120 + 840);
  });
});

describe("capacityUsage", () => {
  test("Saturday-only educator: 120m of 540m is 22% with 420m left", () => {
    const out = capacityUsage({
      capacityMin: 540,
      existingMin: 0,
      pickedMin: 120,
    });
    expect(out.usedMin).toBe(120);
    expect(out.remainingMin).toBe(420);
    expect(out.percentUsed).toBe(22);
    expect(out.overCapacity).toBe(false);
  });

  test("840m of 540m is over capacity", () => {
    const out = capacityUsage({
      capacityMin: 540,
      existingMin: 0,
      pickedMin: 840,
    });
    expect(out.overCapacity).toBe(true);
    expect(out.remainingMin).toBe(-300);
  });

  test("zero capacity never divides by zero", () => {
    const out = capacityUsage({
      capacityMin: 0,
      existingMin: 0,
      pickedMin: 0,
    });
    expect(out.percentUsed).toBe(0);
    expect(out.overCapacity).toBe(false);
  });
});

describe("buildSeedPicks", () => {
  const info = new Map([
    ["s1", { positions: 2 }],
    ["s-unknown", { positions: 0 }],
  ]);

  test("expands legacy rows to the full weekly count", () => {
    expect(
      buildSeedPicks([{ id: "s1", sectionIds: ["sec-1"], sectionSlots: [] }], info),
    ).toEqual({ s1: { "sec-1": [1, 2] } });
  });

  test("keeps explicit picks and extra slot entries", () => {
    expect(
      buildSeedPicks(
        [
          {
            id: "s1",
            sectionIds: ["sec-1"],
            sectionSlots: [
              { sectionId: "sec-1", slots: [2] },
              { sectionId: "sec-2", slots: [1] },
            ],
          },
        ],
        info,
      ),
    ).toEqual({ s1: { "sec-1": [2], "sec-2": [1] } });
  });

  test("drops legacy rows when the requirement is unknown", () => {
    expect(
      buildSeedPicks(
        [{ id: "s-unknown", sectionIds: ["sec-1"], sectionSlots: [] }],
        info,
      ),
    ).toEqual({});
  });
});
