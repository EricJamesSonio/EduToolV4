import {
  ASSESSMENT_TYPE_VALUES,
  SYSTEM_GRADABLE_ASSESSMENT_TYPES,
  MANUAL_ONLY_ASSESSMENT_TYPES,
  isSystemGradable,
  typesForGradingMode,
} from "../constants";
import { resolve } from "path";

// TICK-ASSESS-005. The System-Graded wizard offered `behavior` / `participation`
// because one unfiltered 14-type list fed both the system and manual steps. This
// pins the frontend half of the split.
//
// The `parity with the backend list` test is the important one: the exact class
// of bug this ticket fixes is a type list drifting between layers, so the two
// lists are asserted against each other directly rather than each being pinned
// to its own local copy (which is what let them drift in the first place).
describe("assessment type gradability (TICK-ASSESS-005)", () => {
  const MANUAL_ONLY = [
    "participation",
    "behavior",
    "attendance",
    "performance_task",
  ];
  const SYSTEM_GRADABLE = [
    "written_work",
    "quarterly_assessment",
    "exam",
    "quiz",
    "assignment",
    "project",
    "recitation",
    "activity",
    "custom",
    "other",
  ];

  it("keeps the canonical 14-type list intact (TICK-ASSESS-001)", () => {
    expect(ASSESSMENT_TYPE_VALUES).toHaveLength(14);
  });

  it.each(MANUAL_ONLY)("%s is manual-only", (t) => {
    expect(isSystemGradable(t)).toBe(false);
    expect(MANUAL_ONLY_ASSESSMENT_TYPES).toContain(t);
  });

  it.each(SYSTEM_GRADABLE)("%s is system-gradable", (t) => {
    expect(isSystemGradable(t)).toBe(true);
    expect(SYSTEM_GRADABLE_ASSESSMENT_TYPES).toContain(t);
  });

  it("partitions the 14 types with no overlap", () => {
    const all = [
      ...SYSTEM_GRADABLE_ASSESSMENT_TYPES,
      ...MANUAL_ONLY_ASSESSMENT_TYPES,
    ];
    expect(new Set(all).size).toBe(14);
    expect([...all].sort()).toEqual([...ASSESSMENT_TYPE_VALUES].sort());
  });

  it("fails closed for unknown and legacy types", () => {
    expect(isSystemGradable("manual")).toBe(false);
    expect(isSystemGradable("nonsense")).toBe(false);
    expect(isSystemGradable("")).toBe(false);
  });

  describe("typesForGradingMode", () => {
    const schemeTypes = ["quiz", "behavior", "exam", "participation"];

    it("removes manual-only types for the system path", () => {
      // The exact bug: "behavior" showed up under System-Graded.
      expect(typesForGradingMode(schemeTypes, "system")).toEqual([
        "quiz",
        "exam",
      ]);
    });

    it("removes manual-only types for the hybrid path", () => {
      expect(typesForGradingMode(schemeTypes, "hybrid")).toEqual([
        "quiz",
        "exam",
      ]);
    });

    it("keeps every type for the manual path", () => {
      expect(typesForGradingMode(schemeTypes, "manual")).toEqual(schemeTypes);
    });

    it("does not mutate the input array", () => {
      const input = [...schemeTypes];
      typesForGradingMode(input, "system");
      expect(input).toEqual(schemeTypes);
    });

    it("returns an empty list when the scheme has no auto-gradable type", () => {
      expect(typesForGradingMode(["behavior", "attendance"], "system")).toEqual(
        [],
      );
    });
  });

  it("parity with the backend SYSTEM_GRADABLE_TYPES list", () => {
    // Read the backend source rather than duplicating the values here — a
    // duplicated constant is exactly how these drifted before.
    // `node:fs` (not bare "fs") so next/jest's jsdom resolver doesn't swap in
    // the browser shim, which has no readFileSync.
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const backendSrc = readFileSync(
      resolve(
        __dirname,
        "..", // __tests__ -> assessment-builder
        "..", // assessment-builder -> educator
        "..", // educator -> components
        "..", // components -> src
        "..", // src -> frontend
        "..", // frontend -> repo root
        "backend",
        "src",
        "modules",
        "grading-scheme",
        "constants",
        "assessment-type.constants.ts",
      ),
      "utf8",
    );
    const block = backendSrc.match(
      /SYSTEM_GRADABLE_TYPES[^=]*=\s*\[([\s\S]*?)\]/,
    );
    expect(block).not.toBeNull();
    const backendTypes = Array.from(block![1].matchAll(/ComponentType\.(\w+)/g))
      .map((m) =>
        // SCREAMING_SNAKE -> snake_case. A simple lowerCase() would turn
        // QUARTERLY_ASSESSMENT into "quarterly_assessment" correctly, but the
        // camelCase branch would wrongly yield "quarterlyAssessment" for the
        // two multi-word types, so keep the underscores.
        m[1].toLowerCase(),
      )
      .sort();

    expect(backendTypes).toEqual(
      [...SYSTEM_GRADABLE_ASSESSMENT_TYPES].sort(),
    );
  });
});
