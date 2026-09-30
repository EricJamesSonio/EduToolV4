import { roomUsageToClasses } from "../roomSchedule.utils";
import type { RoomUsage } from "@/types/admin/room.types";

function usage(over: Partial<RoomUsage> = {}): RoomUsage {
  return {
    id: "slot-1",
    roomId: "room-1",
    roomName: "Room 201",
    classId: "class-1",
    weekday: 1,
    startTime: "08:00",
    endTime: "09:00",
    subjectName: "Math",
    sectionName: "BSCS 1-A",
    educatorName: "Jane Doe",
    ...over,
  };
}

describe("roomUsageToClasses", () => {
  it("returns an empty array for no bookings", () => {
    expect(roomUsageToClasses([], "sy-1")).toEqual([]);
  });

  it("maps a booking into a minimal class shell the grid can render", () => {
    const [cls] = roomUsageToClasses([usage()], "sy-1");
    expect(cls.id).toBe("class-1");
    expect(cls.subjectName).toBe("Math");
    expect(cls.sectionName).toBe("BSCS 1-A");
    expect(cls.schedules).toHaveLength(1);
    expect(cls.schedules[0]).toMatchObject({
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
      roomName: "Room 201",
    });
  });

  it("groups a class's slots under one block", () => {
    const classes = roomUsageToClasses(
      [
        usage({ id: "s1", weekday: 1 }),
        usage({ id: "s2", weekday: 3, startTime: "10:00", endTime: "11:00" }),
      ],
      "sy-1",
    );
    expect(classes).toHaveLength(1);
    expect(classes[0].schedules.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("keeps different classes separate", () => {
    const classes = roomUsageToClasses(
      [usage({ classId: "class-1" }), usage({ classId: "class-2" })],
      "sy-1",
    );
    expect(classes).toHaveLength(2);
  });

  it("falls back when subject/section/educator names are missing", () => {
    const [cls] = roomUsageToClasses(
      [usage({ subjectName: null, sectionName: null, educatorName: null })],
      "sy-1",
    );
    expect(cls.subjectName).toBe("Class");
    expect(cls.sectionName).toBeUndefined();
    expect(cls.educatorName).toBeUndefined();
  });
});

describe("active room filtering", () => {
  /** Mirrors the picker's derivation: only bookings in the selected rooms. */
  const filterForRooms = (rows: RoomUsage[], selected: string[]): RoomUsage[] => {
    const set = new Set(selected);
    return rows.filter((u) => u.roomId !== null && set.has(u.roomId));
  };

  const rows = [
    usage({ id: "a", roomId: "room-1" }),
    usage({ id: "b", roomId: "room-2" }),
    usage({ id: "c", roomId: null }),
  ];

  it("shows nothing when no room is selected", () => {
    expect(filterForRooms(rows, [])).toEqual([]);
  });

  it("shows only the selected room", () => {
    expect(filterForRooms(rows, ["room-1"]).map((r) => r.id)).toEqual(["a"]);
  });

  it("shows every selected room at once", () => {
    expect(filterForRooms(rows, ["room-1", "room-2"]).map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("ignores bookings with no room", () => {
    expect(filterForRooms(rows, ["room-1", "room-2"])).not.toContainEqual(
      expect.objectContaining({ id: "c" }),
    );
  });
});

/**
 * Mirrors ClassSchedulePicker's slotRoomIssues. Two slots of the SAME class in
 * one room must never be allowed to overlap — the server rejects it, so the
 * form must too.
 */
describe("same-room self-collision between a class's own slots", () => {
  interface Slot {
    id: number;
    weekday: number;
    startMin: number;
    endMin: number;
    roomId?: string;
  }

  const overlaps = (a: Slot, b: Slot): boolean =>
    a.weekday === b.weekday && a.startMin < b.endMin && a.endMin > b.startMin;

  const findSelfClash = (slots: Slot[]): number[] =>
    slots.reduce<number[]>((acc, slot, i) => {
      if (!slot.roomId) return acc;
      const clashes = slots.some(
        (other, j) =>
          j !== i && other.roomId === slot.roomId && overlaps(slot, other),
      );
      if (clashes) acc.push(i);
      return acc;
    }, []);

  const slot = (id: number, o: Partial<Slot>): Slot => ({
    id,
    weekday: 1,
    startMin: 480,
    endMin: 540,
    ...o,
  });

  it("flags two overlapping slots in the same room", () => {
    const slots = [
      slot(0, { startMin: 480, endMin: 600, roomId: "r1" }),
      slot(1, { startMin: 540, endMin: 660, roomId: "r1" }),
    ];
    expect(findSelfClash(slots)).toEqual([0, 1]);
  });

  it("allows the same room on different days", () => {
    const slots = [
      slot(0, { weekday: 1, startMin: 480, endMin: 600, roomId: "r1" }),
      slot(1, { weekday: 2, startMin: 480, endMin: 600, roomId: "r1" }),
    ];
    expect(findSelfClash(slots)).toEqual([]);
  });

  it("allows back-to-back slots in the same room", () => {
    const slots = [
      slot(0, { startMin: 480, endMin: 600, roomId: "r1" }),
      slot(1, { startMin: 600, endMin: 660, roomId: "r1" }),
    ];
    expect(findSelfClash(slots)).toEqual([]);
  });

  it("allows overlapping slots in DIFFERENT rooms", () => {
    const slots = [
      slot(0, { startMin: 480, endMin: 600, roomId: "r1" }),
      slot(1, { startMin: 480, endMin: 600, roomId: "r2" }),
    ];
    expect(findSelfClash(slots)).toEqual([]);
  });

  it("never flags a slot against itself", () => {
    const slots = [slot(0, { startMin: 480, endMin: 600, roomId: "r1" })];
    expect(findSelfClash(slots)).toEqual([]);
  });

  it("ignores slots with no room", () => {
    const slots = [
      slot(0, { startMin: 480, endMin: 600 }),
      slot(1, { startMin: 480, endMin: 600 }),
    ];
    expect(findSelfClash(slots)).toEqual([]);
  });
});