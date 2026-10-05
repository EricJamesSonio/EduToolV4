/**
 * Readiness issues must always resolve to a page that exists, and must never
 * resolve to a link that goes nowhere. These tests pin the route table and the
 * degrade-to-plain-text fallbacks that keep an unknown backend code safe.
 */

import {
  readinessEntityTarget,
  readinessRefTarget,
  readinessTarget,
} from "../readinessTargets";
import type { ReadinessEntityType } from "@/types/admin/school-year.types";

const SY = "sy-1";
const PROGRAM = "prog-1";

describe("readinessEntityTarget", () => {
  it("routes each entity type to its admin page", () => {
    const cases: Array<[ReadinessEntityType, string, string]> = [
      ["program", PROGRAM, `/admin/programs/${PROGRAM}`],
      ["subject", "sub-1", "/admin/subjects/sub-1"],
      ["class", "class-1", "/admin/classes/class-1"],
      // The section page reads schoolYearId from the URL to resolve context.
      ["section", "sec-1", `/admin/sections/sec-1?schoolYearId=${SY}`],
      // No per-level page exists; levels live in a per-school-year list.
      ["level", "lvl-1", `/admin/school-years/${SY}/levels`],
    ];
    for (const [type, id, expected] of cases) {
      expect(readinessEntityTarget({ id, type }, SY)).toBe(expected);
    }
  });

  it("returns null for an unresolvable entity type", () => {
    expect(
      readinessEntityTarget(
        { id: "x-1", type: "classroom" as ReadinessEntityType },
        SY,
      ),
    ).toBeNull();
  });
});

describe("readinessRefTarget", () => {
  it("routes a course under its owning program", () => {
    expect(
      readinessRefTarget(
        { type: "course", id: "crs-1", name: "BSIT", programId: PROGRAM },
        SY,
      ),
    ).toBe(`/admin/programs/${PROGRAM}/courses/crs-1`);
  });

  it("routes a strand under its owning program", () => {
    expect(
      readinessRefTarget(
        { type: "strand", id: "str-1", name: "ICT", programId: PROGRAM },
        SY,
      ),
    ).toBe(`/admin/programs/${PROGRAM}/strands/str-1`);
  });

  it("refuses to link a course or strand with no programId", () => {
    // The nested route cannot be built without the program, and a wrong link
    // is worse than no link.
    expect(
      readinessRefTarget({ type: "course", id: "crs-1", name: "BSIT" }, SY),
    ).toBeNull();
    expect(
      readinessRefTarget({ type: "strand", id: "str-1", name: "ICT" }, SY),
    ).toBeNull();
  });

  it("falls through to the entity table for other ref types", () => {
    expect(
      readinessRefTarget(
        { type: "level", id: "lvl-1", name: "Grade 7" },
        SY,
      ),
    ).toBe(`/admin/school-years/${SY}/levels`);
    expect(
      readinessRefTarget(
        { type: "program", id: PROGRAM, name: "College" },
        SY,
      ),
    ).toBe(`/admin/programs/${PROGRAM}`);
  });
});

describe("readinessTarget", () => {
  it("links per-entity issues to the entity they name", () => {
    const codes = [
      "program_no_levels",
      "course_no_level",
      "strand_no_level",
      "level_no_sections",
      "level_no_subjects",
    ];
    for (const code of codes) {
      const href = readinessTarget(
        {
          code,
          ref: { type: "level", id: "lvl-1", name: "Grade 7" },
        },
        SY,
      );
      expect(href).toBe(`/admin/school-years/${SY}/levels`);
    }
  });

  it("leaves the start-date issue unlinked (fixed via the Edit dialog)", () => {
    expect(readinessTarget({ code: "missing_start_date" }, SY)).toBeNull();
  });

  it("leaves no_programs unlinked (nothing to open)", () => {
    expect(readinessTarget({ code: "no_programs" }, SY)).toBeNull();
  });

  it("leaves aggregated issues unlinked; their entities are linked instead", () => {
    const codes = [
      "subject_no_class",
      "section_no_class",
      "program_no_calendar",
      "program_no_grading_scale",
      "program_no_semester_assignment",
      "program_semester_dates_incomplete",
      "class_no_grading_scheme",
    ];
    for (const code of codes) {
      expect(readinessTarget({ code }, SY)).toBeNull();
    }
  });

  it("degrades to plain text for an issue code it has never seen", () => {
    // A newer backend may add a check; it must render as text, not a dead link.
    expect(
      readinessTarget({ code: "some_future_check", ref: { type: "level", id: "l", name: "L" } }, SY),
    ).toBe(`/admin/school-years/${SY}/levels`);
    expect(readinessTarget({ code: "some_future_check" }, SY)).toBeNull();
  });
});
