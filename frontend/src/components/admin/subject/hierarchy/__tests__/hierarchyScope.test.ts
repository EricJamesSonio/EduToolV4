import {
  findScopeProgram,
  hierarchyScopePrompt,
  isHierarchyScopeReady,
  type ScopeProgram,
} from "../hierarchyScope";
import type { Program } from "@/types/admin/program.types";

const college = (courses: number): ScopeProgram => ({
  type: "college",
  courses: Array.from({ length: courses }, (_, i) => ({ id: `c${i}` })),
  strands: [],
});

const shs = (strands: number): ScopeProgram => ({
  type: "shs",
  courses: [],
  strands: Array.from({ length: strands }, (_, i) => ({ id: `s${i}` })),
});

describe("isHierarchyScopeReady", () => {
  it("is not ready with nothing selected", () => {
    expect(isHierarchyScopeReady({}, null)).toBe(false);
  });

  it("is not ready on a bare school year — the reported bug", () => {
    // A school year alone used to fetch EVERY department's subjects at once.
    expect(isHierarchyScopeReady({ schoolYearId: "sy1" }, null)).toBe(false);
    expect(
      isHierarchyScopeReady({ schoolYearId: "sy1" }, college(3)),
    ).toBe(false);
  });

  it("is not ready while a college program is still unknown to the cache", () => {
    // programs list may not have resolved yet; never treat that as "ready".
    expect(isHierarchyScopeReady({ programId: "p1" }, null)).toBe(false);
    expect(isHierarchyScopeReady({ programId: "p1" }, undefined)).toBe(false);
  });

  it("waits for a course on a college program that has courses", () => {
    expect(isHierarchyScopeReady({ programId: "p1" }, college(3))).toBe(false);
    expect(
      isHierarchyScopeReady({ programId: "p1", courseId: "c0" }, college(3)),
    ).toBe(true);
  });

  it("waits for a strand on an SHS program that has strands", () => {
    expect(isHierarchyScopeReady({ programId: "p1" }, shs(2))).toBe(false);
    expect(
      isHierarchyScopeReady({ programId: "p1", strandId: "s0" }, shs(2)),
    ).toBe(true);
  });

  it("is ready on a college program with NO courses — nothing to narrow by", () => {
    expect(isHierarchyScopeReady({ programId: "p1" }, college(0))).toBe(true);
  });

  it("is ready on an SHS program with NO strands", () => {
    expect(isHierarchyScopeReady({ programId: "p1" }, shs(0))).toBe(true);
  });

  it("is ready on a department with neither course nor strand", () => {
    const plain: ScopeProgram = { type: "jhs", courses: [], strands: [] };
    expect(isHierarchyScopeReady({ programId: "p1" }, plain)).toBe(true);
  });

  it("does NOT demand a selection the filter would never offer", () => {
    // The filter only renders Course for `college` and Strand for `shs`. A
    // `custom` program that happens to have courses shows no Course dropdown,
    // so requiring one here would be an unreachable state — a permanently
    // empty screen. Mirrors SubjectHierarchyFilter's own conditions.
    const custom: ScopeProgram = {
      type: "custom",
      courses: [{ id: "c0" }],
      strands: [{ id: "s0" }],
    };
    expect(isHierarchyScopeReady({ programId: "p1" }, custom)).toBe(true);
    expect(
      isHierarchyScopeReady({ programId: "p1" }, { type: "college", courses: null }),
    ).toBe(true);
  });

  it("keeps working once a level is also selected", () => {
    expect(
      isHierarchyScopeReady(
        { programId: "p1", courseId: "c0", levelId: "lvl1" },
        college(3),
      ),
    ).toBe(true);
  });
});

describe("hierarchyScopePrompt", () => {
  it("names the outstanding step", () => {
    expect(hierarchyScopePrompt({ programId: "p1" }, college(2))).toBe("course");
    expect(hierarchyScopePrompt({ programId: "p1" }, shs(2))).toBe("strand");
  });

  it("is null once ready", () => {
    expect(
      hierarchyScopePrompt({ programId: "p1", courseId: "c0" }, college(2)),
    ).toBeNull();
    expect(hierarchyScopePrompt({ programId: "p1" }, shs(0))).toBeNull();
  });

  it("stays silent before a department is chosen", () => {
    // The page shows its own "pick a school year and department" copy, so the
    // prompt must not double up here.
    expect(hierarchyScopePrompt({}, null)).toBeNull();
  });
});

describe("findScopeProgram", () => {
  const programs = [
    { id: "p1", name: "College / University" },
    { id: "p2", name: "Senior High" },
  ] as unknown as Program[];

  it("resolves by id", () => {
    expect(findScopeProgram(programs, "p2")?.name).toBe("Senior High");
  });

  it("returns null for an unknown id or no list", () => {
    expect(findScopeProgram(programs, "nope")).toBeNull();
    expect(findScopeProgram(undefined, "p1")).toBeNull();
    expect(findScopeProgram(programs, undefined)).toBeNull();
  });
});