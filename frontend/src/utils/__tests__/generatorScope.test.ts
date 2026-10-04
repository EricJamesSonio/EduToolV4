import {
  buildScopeTree,
  computeCoverage,
  subjectsInScope,
  visibleSectionIds,
} from "@/utils/generatorScope";
import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import type { Subject } from "@/types/admin/subject.types";

const program = (
  id: string,
  overrides: Partial<Program> = {},
): Program => ({
  id,
  orgId: "org-1",
  schoolYearId: "sy-1",
  school_year_id: "sy-1",
  name: `Program ${id}`,
  type: "college",
  courses: [],
  strands: [],
  ...overrides,
});

const level = (
  id: string,
  programId: string,
  overrides: Partial<Level> = {},
): Level => ({
  id,
  org_id: "org-1",
  program_id: programId,
  school_year_id: "sy-1",
  name: `Level ${id}`,
  ...overrides,
});

const subject = (
  id: string,
  overrides: Partial<Subject> = {},
): Subject =>
  ({
    id,
    programId: "prog-college",
    levelId: "lvl-1",
    courseId: null,
    strandId: null,
    title: `Subject ${id}`,
    ...overrides,
  }) as Subject;

describe("buildScopeTree", () => {
  test("groups college levels under their courses", () => {
    const tree = buildScopeTree(
      [
        program("prog-college", {
          courses: [
            { id: "c-bscs", name: "BSCS", code: "BSCS" },
            { id: "c-bsit", name: "BSIT", code: "BSIT" },
          ],
        }),
      ],
      [
        level("lvl-1", "prog-college", { course_id: "c-bscs" }),
        level("lvl-2", "prog-college", { course_id: "c-bsit" }),
      ],
      [
        { id: "sec-a", name: "A", level_id: "lvl-1" },
        { id: "sec-b", name: "B", level_id: "lvl-2" },
      ],
    );
    expect(tree).toHaveLength(1);
    expect(tree[0].groups.map((g) => g.name)).toEqual(["BSCS", "BSIT"]);
    expect(tree[0].groups[0].levels[0].sections.map((s) => s.id)).toEqual([
      "sec-a",
    ]);
  });

  test("keeps direct levels for programs without courses or strands", () => {
    const tree = buildScopeTree(
      [program("prog-elem", { type: "elementary" })],
      [level("lvl-1", "prog-elem")],
      [{ id: "sec-a", name: "A", level_id: "lvl-1" }],
    );
    expect(tree[0].groups).toHaveLength(1);
    expect(tree[0].groups[0].kind).toBeNull();
  });
});

describe("visibleSectionIds", () => {
  const tree = buildScopeTree(
    [
      program("prog-college", {
        courses: [{ id: "c-bscs", name: "BSCS", code: "BSCS" }],
      }),
    ],
    [level("lvl-1", "prog-college", { course_id: "c-bscs" })],
    [{ id: "sec-a", name: "A", level_id: "lvl-1" }],
  );

  test("a course-only scope sees just that course's sections", () => {
    expect(
      visibleSectionIds(tree, {
        programIds: ["prog-college"],
        courseIds: ["c-bscs"],
        strandIds: [],
      }),
    ).toEqual(["sec-a"]);
    expect(
      visibleSectionIds(tree, {
        programIds: ["prog-college"],
        courseIds: ["c-other"],
        strandIds: [],
      }),
    ).toEqual([]);
  });
});

describe("subjectsInScope", () => {
  const subjects = [
    subject("s1", { courseId: "c-bscs" }),
    subject("s2", { courseId: "c-bsit" }),
    subject("s3", { courseId: null }),
  ];

  test("course filter keeps only direct course members", () => {
    expect(
      subjectsInScope(subjects, {
        programIds: ["prog-college"],
        courseIds: ["c-bscs"],
        strandIds: [],
      }).map((s) => s.id),
    ).toEqual(["s1"]);
  });

  test("empty course filter keeps every department subject", () => {
    expect(
      subjectsInScope(subjects, {
        programIds: ["prog-college"],
        courseIds: [],
        strandIds: [],
      }),
    ).toHaveLength(3);
  });
});

describe("computeCoverage", () => {
  const subjects = [
    subject("s1", { title: "Math" }),
    subject("s2", { title: "Science" }),
  ];
  const teachable = new Map([
    ["e1", ["s1", "s2"]],
    ["e2", ["s2"]],
  ]);

  test("deselecting the only holder uncovers the subject", () => {
    const out = computeCoverage(subjects, teachable, ["e2"]);
    expect(out.uncoveredSubjectIds).toEqual(["s1"]);
    expect(out.coveredCountByEducator.get("e2")).toBe(1);
  });

  test("null selection means everyone is in", () => {
    const out = computeCoverage(subjects, teachable, null);
    expect(out.uncoveredSubjectIds).toEqual([]);
    expect(out.coveredCountByEducator.get("e1")).toBe(2);
  });
});
