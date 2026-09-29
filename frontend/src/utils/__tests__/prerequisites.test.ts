import {
  getMissingPrerequisites,
  hasUnmetPrerequisites,
  describeMissingPrerequisites,
  prerequisiteBlockMessage,
  missReasonLabel,
  type PrereqEligibilityMap,
} from "@/utils/prerequisites";

// The three admin enrollment surfaces all delegate their prerequisite copy and
// block decision to these helpers, so a regression here silently breaks all of
// them at once. The underlying gate is server-side; this is UX only.

describe("prerequisite presentation helpers", () => {
  describe("hasUnmetPrerequisites", () => {
    it("is false for undefined and empty lists", () => {
      expect(hasUnmetPrerequisites(undefined)).toBe(false);
      expect(hasUnmetPrerequisites([])).toBe(false);
    });

    it("is true when at least one prerequisite is unmet", () => {
      expect(
        hasUnmetPrerequisites([
          { subject_id: "p-1", subject_name: "Math", reason: "not_taken" },
        ]),
      ).toBe(true);
    });
  });

  describe("describeMissingPrerequisites", () => {
    it("returns an empty string when there is nothing missing", () => {
      expect(describeMissingPrerequisites(undefined)).toBe("");
      expect(describeMissingPrerequisites([])).toBe("");
    });

    it("joins up to the limit", () => {
      expect(
        describeMissingPrerequisites([
          { subject_id: "p-1", subject_name: "Math", reason: "not_taken" },
          { subject_id: "p-2", subject_name: "Physics", reason: "not_taken" },
        ]),
      ).toBe("Math, Physics");
    });

    it("summarizes the remainder beyond the limit", () => {
      expect(
        describeMissingPrerequisites(
          [
            { subject_id: "p-1", subject_name: "Math", reason: "not_taken" },
            { subject_id: "p-2", subject_name: "Physics", reason: "not_taken" },
            { subject_id: "p-3", subject_name: "Chemistry", reason: "not_taken" },
          ],
          2,
        ),
      ).toBe("Math, Physics (+1 more)");
    });

    it("ignores entries with a blank subject name", () => {
      expect(
        describeMissingPrerequisites([
          { subject_id: "p-1", subject_name: "", reason: "not_taken" },
        ]),
      ).toBe("");
    });
  });

  describe("prerequisiteBlockMessage", () => {
    it("names the single missing prerequisite with singular wording", () => {
      const msg = prerequisiteBlockMessage("Juan Dela Cruz", [
        { subject_id: "p-1", subject_name: "Calculus", reason: "not_taken" },
      ]);
      expect(msg).toBe(
        "Juan Dela Cruz cannot be enrolled — unmet prerequisite: Calculus.",
      );
    });

    it("uses plural wording for multiple misses", () => {
      const msg = prerequisiteBlockMessage("Juan Dela Cruz", [
        { subject_id: "p-1", subject_name: "Calculus", reason: "not_taken" },
        { subject_id: "p-2", subject_name: "Physics", reason: "not_passed" },
      ]);
      expect(msg).toBe(
        "Juan Dela Cruz cannot be enrolled — unmet prerequisites: Calculus, Physics.",
      );
    });

    it("still explains the block when no detail is available", () => {
      const msg = prerequisiteBlockMessage("Juan Dela Cruz", undefined);
      expect(msg).toBe(
        "Juan Dela Cruz cannot be enrolled in this class — unmet prerequisite.",
      );
    });
  });

  describe("missReasonLabel", () => {
    it("labels each known reason", () => {
      expect(missReasonLabel("not_taken")).toBe("not taken");
      expect(missReasonLabel("not_passed")).toBe("not passed");
      expect(missReasonLabel("not_locked")).toBe("grade not finalized");
    });
  });
});
describe("getMissingPrerequisites (batch map key order)", () => {
  // Shape returned by POST /subject-prerequisites/check-batch:
  // { <studentId>: { <subjectId>: { eligible, missing } } }
  // The STUDENT id is the outer key. Reading the outer level with a subject id
  // returns undefined and silently marks everyone eligible — which is exactly
  // how the gray-out failed to render while the request returned 201.
  const map: PrereqEligibilityMap = {
    "stu-1": {
      "sub-1": {
        eligible: true,
        missing: [],
      },
    },
    "stu-2": {
      "sub-1": {
        eligible: false,
        missing: [
          {
            subject_id: "p-1",
            subject_name: "Artificial Intelligence",
            reason: "not_taken",
          },
          {
            subject_id: "p-2",
            subject_name: "Data Structures and Algorithms",
            reason: "not_taken",
          },
        ],
      },
    },
  };

  it("reads the outer level by student id, then the inner by subject id", () => {
    expect(getMissingPrerequisites(map, "stu-1", "sub-1")).toEqual([]);
    expect(getMissingPrerequisites(map, "stu-2", "sub-1")).toHaveLength(2);
    expect(getMissingPrerequisites(map, "stu-2", "sub-1")[0].subject_name).toBe(
      "Artificial Intelligence",
    );
  });

  it("returns empty for an unknown student instead of throwing", () => {
    expect(getMissingPrerequisites(map, "stu-unknown", "sub-1")).toEqual([]);
  });

  it("returns empty for an unknown subject instead of throwing", () => {
    expect(getMissingPrerequisites(map, "stu-2", "sub-unknown")).toEqual([]);
  });

  it("returns empty when the map has not loaded yet", () => {
    expect(getMissingPrerequisites(undefined, "stu-2", "sub-1")).toEqual([]);
    expect(getMissingPrerequisites(null, "stu-2", "sub-1")).toEqual([]);
  });

  it("returns empty when subjectId is missing", () => {
    expect(getMissingPrerequisites(map, "stu-2", null)).toEqual([]);
    expect(getMissingPrerequisites(map, "stu-2", undefined)).toEqual([]);
  });

  it("does NOT resolve a subject id against the outer (student) level", () => {
    // The regression: map[subjectId] must not be treated as a student record.
    const transposed = { "sub-1": { "stu-1": { eligible: true, missing: [] } } };
    expect(getMissingPrerequisites(transposed, "stu-1", "sub-1")).toEqual([]);
  });
});