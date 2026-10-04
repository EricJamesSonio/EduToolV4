import {
  generatorEntityTarget,
  generatorIssueTarget,
} from "@/utils/generatorReadinessTargets";

const SY = "sy-1";

describe("generatorEntityTarget", () => {
  test("educator links to the educator detail page", () => {
    expect(generatorEntityTarget({ id: "e1", type: "educator" }, SY)).toBe(
      "/admin/educators/e1",
    );
  });

  test("subject links to the subject detail page", () => {
    expect(generatorEntityTarget({ id: "s1", type: "subject" }, SY)).toBe(
      "/admin/subjects/s1",
    );
  });

  test("program links to the program detail page", () => {
    expect(generatorEntityTarget({ id: "p1", type: "program" }, SY)).toBe(
      "/admin/programs/p1",
    );
  });

  test("section links carry the school year for context", () => {
    expect(generatorEntityTarget({ id: "sec1", type: "section" }, SY)).toBe(
      "/admin/sections/sec1?schoolYearId=sy-1",
    );
  });

  test("unknown entity kinds degrade to plain text", () => {
    expect(
      generatorEntityTarget({ id: "x", type: "class" as never }, SY),
    ).toBeNull();
  });
});

describe("generatorIssueTarget", () => {
  test("missing school days link to the schedule tab", () => {
    expect(
      generatorIssueTarget({ code: "no_active_weekdays", ref: undefined }, SY),
    ).toBe("/admin/organization/schedule");
  });

  test("aggregate issues without a ref stay unlinked", () => {
    expect(
      generatorIssueTarget({ code: "educator_no_subjects", ref: undefined }, SY),
    ).toBeNull();
  });

  test("ref issues route to the referenced entity", () => {
    expect(
      generatorIssueTarget(
        {
          code: "educator_no_days",
          ref: { type: "educator", id: "e1", name: "Alice" },
        },
        SY,
      ),
    ).toBe("/admin/educators/e1");
  });

  test("unknown codes degrade to plain text", () => {
    expect(
      generatorIssueTarget({ code: "future_code", ref: undefined }, SY),
    ).toBeNull();
  });
});
