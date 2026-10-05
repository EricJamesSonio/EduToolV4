import type { Class, ClassSchedule } from "@/types/admin/class.types";
import type { RoomUsage } from "@/types/admin/room.types";

/**
 * Turns room booking rows into minimal `Class` shells so `WeeklyScheduleGrid`
 * (which is typed to `Class[]`) can render them. The grid only ever reads
 * `id`, `schedules`, `subjectName` and `sectionName`, so everything else is a
 * harmless placeholder.
 *
 * Kept pure and exported so it can be unit-tested without rendering anything.
 */
export function roomUsageToClasses(
  usage: RoomUsage[],
  schoolYearId: string,
): Class[] {
  const byClass = new Map<string, Class>();

  for (const u of usage) {
    const slot: ClassSchedule = {
      id: u.id,
      classId: u.classId,
      weekday: u.weekday,
      startTime: u.startTime,
      endTime: u.endTime,
      roomId: u.roomId,
      roomName: u.roomName,
    };

    const existing = byClass.get(u.classId);
    if (existing) {
      existing.schedules.push(slot);
      continue;
    }

    byClass.set(u.classId, {
      id: u.classId,
      orgId: "",
      subjectId: "",
      subjectName: u.subjectName ?? "Class",
      sectionId: null,
      sectionName: u.sectionName ?? undefined,
      semesterId: "",
      schoolYearId,
      educatorId: "",
      educatorName: u.educatorName ?? undefined,
      capacity: 0,
      enrolledCount: 0,
      status: "active",
      schedules: [slot],
      createdAt: "",
    });
  }

  return [...byClass.values()];
}