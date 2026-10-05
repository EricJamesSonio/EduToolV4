/** A room, as returned by the Rooms list endpoint. */
export interface Room {
  id: string;
  orgId: string;
  name: string;
  /**
   * How many live schedule slots use this room in the school year the list was
   * fetched with. Absent when no schoolYearId was passed — which is why the UI
   * must treat it as "unknown" (0) rather than assume the room is unused.
   */
  slotCount?: number;
}

/** One booked slot on a room, scoped to a single school year. */
export interface RoomUsage {
  id: string;
  roomId: string | null;
  roomName: string | null;
  classId: string;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  subjectName: string | null;
  sectionName: string | null;
  educatorName: string | null;
}