import {
  CREATE_CLASS_PICK_ORDER,
  buildCreateSelectionGate,
  buildSelectionGate,
  describeMissing,
  missingPicks,
} from "../CreateClassStepGate";

const full = {
  programId: "p1",
  semesterId: "s1",
  trackId: "t1",
  levelId: "l1",
  sectionId: "sec1",
  subjectId: "sub1",
  educatorId: "e1",
};

describe("CreateClassStepGate", () => {
  describe("missingPicks", () => {
    it("reports everything missing in strict selection order", () => {
      expect(missingPicks({}, { hasTrack: true })).toEqual([
        "programId",
        "semesterId",
        "trackId",
        "levelId",
        "sectionId",
        "subjectId",
        "educatorId",
      ]);
    });

    it("does not require a track when the department has none", () => {
      expect(missingPicks({}, { hasTrack: false })).not.toContain("trackId");
    });

    it("still requires a track when the department does have one", () => {
      expect(missingPicks({}, { hasTrack: true })).toContain("trackId");
    });

    it("keeps the remaining picks in order once some are chosen", () => {
      const missing = missingPicks(
        { ...full, sectionId: "", subjectId: "", educatorId: "" },
        { hasTrack: true },
      );
      expect(missing).toEqual(["sectionId", "subjectId", "educatorId"]);
    });
  });

  describe("describeMissing", () => {
    it("handles one, two and three items", () => {
      expect(describeMissing(["sectionId"])).toBe("section");
      expect(describeMissing(["sectionId", "subjectId"])).toBe("section and subject");
      expect(describeMissing(["sectionId", "subjectId", "educatorId"])).toBe(
        "section, subject and educator",
      );
    });

    it("returns an empty string when nothing is missing", () => {
      expect(describeMissing([])).toBe("");
    });
  });

  describe("buildSelectionGate (create rules)", () => {
    it("is closed until every pick is made", () => {
      const gate = buildSelectionGate({}, CREATE_CLASS_PICK_ORDER, { hasTrack: true });
      expect(gate.ready).toBe(false);
    });

    // The regression that mattered: the picker used to check subject +
    // educator only, so an admin could place schedule slots on a class with
    // no section at all.
    it("stays closed while the section is missing", () => {
      const gate = buildSelectionGate(
        { ...full, sectionId: "" },
        CREATE_CLASS_PICK_ORDER,
        { hasTrack: true },
      );
      expect(gate.ready).toBe(false);
      expect(gate.missing).toContain("sectionId");
      expect(gate.hint).toContain("section");
    });

    it("stays closed while the subject is missing", () => {
      const gate = buildSelectionGate(
        { ...full, subjectId: "" },
        CREATE_CLASS_PICK_ORDER,
        { hasTrack: true },
      );
      expect(gate.ready).toBe(false);
      expect(gate.hint).toContain("subject");
    });

    it("stays closed while the educator is missing", () => {
      const gate = buildSelectionGate(
        { ...full, educatorId: "" },
        CREATE_CLASS_PICK_ORDER,
        { hasTrack: true },
      );
      expect(gate.ready).toBe(false);
      expect(gate.hint).toContain("educator");
    });

    it("opens only once every pick is made", () => {
      const gate = buildSelectionGate(full, CREATE_CLASS_PICK_ORDER, { hasTrack: true });
      expect(gate.ready).toBe(true);
      expect(gate.hint).toBe("");
    });

    it("ignores the track when the department has none", () => {
      const { trackId, ...withoutTrack } = full;
      const gate = buildSelectionGate(withoutTrack, CREATE_CLASS_PICK_ORDER, {
        hasTrack: false,
      });
      expect(gate.ready).toBe(true);
    });
  });

  describe("buildSelectionGate (edit rules)", () => {
    // EditClassForm has no subjectId and sectionId is optional, so Edit must
    // not inherit Create's rule — that mismatch had locked the edit schedule
    // grid permanently.
    it("needs only the educator", () => {
      const gate = buildSelectionGate({}, ["educatorId"]);
      expect(gate.ready).toBe(false);
      expect(gate.hint).toBe("Select educator first.");
    });

    it("opens as soon as an educator is chosen, with no subject or section", () => {
      const gate = buildSelectionGate({ educatorId: "e1" }, ["educatorId"]);
      expect(gate.ready).toBe(true);
    });
  });

  describe("buildCreateSelectionGate", () => {
    it("blocks when the section already has a class for the subject", () => {
      const gate = buildCreateSelectionGate(full, {
        hasTrack: true,
        subjectAlreadyHasClass: true,
      });
      expect(gate.ready).toBe(false);
      expect(gate.hint).toContain("already has a class");
    });

    it("does not blame the subject when picks are simply missing", () => {
      const gate = buildCreateSelectionGate({}, {
        hasTrack: true,
        subjectAlreadyHasClass: true,
      });
      expect(gate.ready).toBe(false);
      expect(gate.hint).not.toContain("already has a class");
    });

    it("opens when everything is picked and there is no duplicate", () => {
      const gate = buildCreateSelectionGate(full, {
        hasTrack: true,
        subjectAlreadyHasClass: false,
      });
      expect(gate.ready).toBe(true);
    });
  });
});