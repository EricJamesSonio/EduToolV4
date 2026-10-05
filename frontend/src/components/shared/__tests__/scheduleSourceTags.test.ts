import {
  sourceStyle,
  sourceLabel,
  legendStyle,
  legendLabel,
  PICK_CONFLICT_STYLE,
  type ScheduleTag,
} from "@/components/shared/WeeklyScheduleGrid";

describe("schedule source tags", () => {
  describe("sourceStyle", () => {
    it("returns undefined for no tag so the block keeps its class colour", () => {
      expect(sourceStyle(undefined)).toBeUndefined();
      expect(sourceStyle([])).toBeUndefined();
    });

    it("gives each single source its own colour", () => {
      const section = sourceStyle(["section"]);
      const educator = sourceStyle(["educator"]);
      const room = sourceStyle(["room"]);

      expect(section).toBeDefined();
      expect(educator).toBeDefined();
      expect(room).toBeDefined();
      // Distinct swatches, otherwise the three sources are indistinguishable.
      expect(new Set([section, educator, room]).size).toBe(3);
    });

    it("flags any combination of two or more sources as contended", () => {
      const contended = sourceStyle(["section", "educator"]);
      expect(sourceStyle(["section", "room"])).toBe(contended);
      expect(sourceStyle(["educator", "room"])).toBe(contended);
      expect(sourceStyle(["section", "educator", "room"])).toBe(contended);
    });
  });

  describe("sourceLabel", () => {
    it("is empty for no tag", () => {
      expect(sourceLabel(undefined)).toBe("");
      expect(sourceLabel([])).toBe("");
    });

    it("names a single source", () => {
      expect(sourceLabel(["section"])).toBe("Section");
      expect(sourceLabel(["educator"])).toBe("Educator busy");
      expect(sourceLabel(["room"])).toBe("Room booked");
    });

    it("joins multiple sources", () => {
      expect(sourceLabel(["section", "educator"])).toBe(
        "Section & Educator busy",
      );
      expect(sourceLabel(["section", "room"])).toBe("Section & Room booked");
      expect(sourceLabel(["section", "educator", "room"])).toBe(
        "Section & Educator busy & Room booked",
      );
    });
  });

  describe("legend", () => {
    it("maps each source to its swatch and label", () => {
      expect(legendStyle("room")).toBe(sourceStyle(["room"]));
      expect(legendStyle("section")).toBe(sourceStyle(["section"]));
      expect(legendLabel("room")).toBe("Room booked");
    });

    it("shares one 'Section & educator' entry for every multi-source block", () => {
      expect(legendStyle("contended")).toBe(sourceStyle(["section", "educator"]));
      expect(legendLabel("contended")).toBe("Section & educator");
    });

    it("does NOT use the destructive red for contended blocks", () => {
      // Red is reserved for a picked slot that cannot be saved. Using it here
      // made ordinary section+educator classes look like a room clash.
      const contended = sourceStyle(["section", "educator"]) ?? "";
      expect(contended).not.toContain("destructive");
      expect(PICK_CONFLICT_STYLE).toContain("destructive");
    });
  });
});