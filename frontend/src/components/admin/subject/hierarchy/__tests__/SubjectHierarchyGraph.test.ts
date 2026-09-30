import {
  buildGraphIndex,
  directNeighbors,
} from "../SubjectHierarchyGraph";
import { scopeKey } from "@/hooks/admin/useSubjectHierarchy";
import type { HierarchyEdge, HierarchyNode } from "@/api/admin/subject-hierarchy.api";

const node = (
  id: string,
  rank: number,
  levelId: string | null = `lvl-${rank}`,
): HierarchyNode => ({
  id,
  name: id,
  levelId,
  levelName: `Year ${rank}`,
  yearRank: rank,
  courseName: null,
  strandName: null,
  termLabel: null,
});

/**
 * Chain: Alg1 -> Math -> Calculus -> Physics. Exercises a deep chain so a
 * transitive regression would light more nodes than expected.
 */
const nodes: HierarchyNode[] = [
  node("alg1", 1),
  node("math", 2),
  node("calculus", 3),
  node("physics", 4),
];

const edges: HierarchyEdge[] = [
  { from: "math", to: "calculus" },
  { from: "calculus", to: "physics" },
  { from: "alg1", to: "math" },
];

const index = buildGraphIndex(nodes, edges);

describe("directNeighbors", () => {
  it("returns only immediate prerequisites", () => {
    const { prereqs } = directNeighbors("calculus", index);
    expect(prereqs).toEqual(["math"]);
  });

  it("returns only immediate dependents", () => {
    const { dependents } = directNeighbors("calculus", index);
    expect(dependents).toEqual(["physics"]);
  });

  it("does NOT walk the chain transitively", () => {
    // Math's prerequisite is Alg1 — one hop further out. It must not be lit
    // when Calculus is selected, otherwise selecting a subject highlights the
    // whole ancestor chain "until the end".
    const { lit } = directNeighbors("calculus", index);
    expect(lit.has("alg1")).toBe(false);
    expect([...lit].sort()).toEqual(["calculus", "math", "physics"]);
  });

  it("does NOT walk descendants transitively either", () => {
    const { lit } = directNeighbors("math", index);
    // Physics is two hops below Math.
    expect(lit.has("physics")).toBe(false);
    expect([...lit].sort()).toEqual(["alg1", "calculus", "math"]);
  });

  it("includes the selected subject itself in the lit set", () => {
    const { lit } = directNeighbors("calculus", index);
    expect(lit.has("calculus")).toBe(true);
  });

  it("handles an entry subject with no prerequisites", () => {
    const { prereqs, dependents, lit } = directNeighbors("alg1", index);
    expect(prereqs).toEqual([]);
    expect(dependents).toEqual(["math"]);
    expect([...lit].sort()).toEqual(["alg1", "math"]);
  });

  it("handles a leaf with no dependents", () => {
    const { prereqs, dependents } = directNeighbors("physics", index);
    expect(prereqs).toEqual(["calculus"]);
    expect(dependents).toEqual([]);
  });

  it("handles a subject with both sides empty", () => {
    const solo = buildGraphIndex([node("solo", 1)], []);
    const { prereqs, dependents, lit } = directNeighbors("solo", solo);
    expect(prereqs).toEqual([]);
    expect(dependents).toEqual([]);
    expect([...lit]).toEqual(["solo"]);
  });
});

describe("scopeKey", () => {
  it("includes levelId so level selections do not collide", () => {
    expect(scopeKey({ programId: "p1", levelId: "lvl-1" })).not.toBe(
      scopeKey({ programId: "p1", levelId: "lvl-2" }),
    );
  });

  it("distinguishes an explicit level from no level", () => {
    expect(scopeKey({ programId: "p1", levelId: "lvl-1" })).not.toBe(
      scopeKey({ programId: "p1" }),
    );
  });

  it("is stable for the same scope", () => {
    expect(scopeKey({ programId: "p1", levelId: "lvl-1" })).toBe(
      scopeKey({ programId: "p1", levelId: "lvl-1" }),
    );
  });

  it("is order-independent so the same scope maps to one cache entry", () => {
    expect(
      scopeKey({
        schoolYearId: "s",
        programId: "p",
        courseId: "c",
        strandId: "st",
        levelId: "l",
      }),
    ).toBe(
      scopeKey({
        strandId: "st",
        courseId: "c",
        levelId: "l",
        programId: "p",
        schoolYearId: "s",
      }),
    );
  });
});