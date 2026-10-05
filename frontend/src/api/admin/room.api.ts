import client from "@/api/client";
import { toTimeString } from "@/api/admin/class.api";
import type { Room, RoomUsage } from "@/types/admin/room.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Raw backend shape. The Room row is a Prisma model, so its own columns stay
// snake_case (org_id) — but `slotCount` is a field the service ADDS in
// `list()` under that exact camelCase name. The global ResponseInterceptor only
// wraps the payload in { success, data }; it does NOT case-convert. Reading
// `slot_count` here silently yields undefined and every room reads "Not used yet".
interface RawRoom {
  id: string;
  org_id: string;
  name: string;
  /** Present only when the list was called with a schoolYearId. */
  slotCount?: number;
}

interface RawUsage {
  id: string;
  room_id: string | null;
  room_name: string | null;
  class_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  subject_name: string | null;
  section_name: string | null;
  educator_name: string | null;
}

function mapRoom(raw: RawRoom): Room {
  return {
    id: raw.id,
    orgId: raw.org_id,
    name: raw.name,
    // Explicit `undefined` (not a conditional spread) so a genuine 0 survives
    // and a missing count is still representable.
    slotCount: raw.slotCount,
  };
}

function mapUsage(raw: RawUsage): RoomUsage {
  return {
    id: raw.id,
    roomId: raw.room_id,
    roomName: raw.room_name,
    classId: raw.class_id,
    weekday: raw.weekday,
    // Reuses the class API's local-wall-clock conversion so room times and
    // class times can never disagree.
    startTime: toTimeString(raw.start_time),
    endTime: toTimeString(raw.end_time),
    subjectName: raw.subject_name,
    sectionName: raw.section_name,
    educatorName: raw.educator_name,
  };
}

export const roomApi = {
  /**
   * Pass schoolYearId to get a per-room slotCount for the card summaries in
   * one grouped query, rather than a request per card.
   */
  list: async (schoolYearId?: string | null): Promise<Room[]> => {
    const res = await client.get<ApiResponse<RawRoom[]>>("/rooms", {
      params: schoolYearId ? { schoolYearId } : undefined,
    });
    return (res.data?.data ?? []).map(mapRoom);
  },

  create: async (name: string): Promise<Room> => {
    const res = await client.post<ApiResponse<RawRoom>>("/rooms", { name });
    return mapRoom(res.data.data);
  },

  rename: async (id: string, name: string): Promise<Room> => {
    const res = await client.patch<ApiResponse<RawRoom>>(`/rooms/${id}`, { name });
    return mapRoom(res.data.data);
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/rooms/${id}`);
  },

  /**
   * Weekly bookings for every room in the year, or for one room when
   * roomId is given. Backs both the per-room grid and the "is this room busy
   * at that time?" grey-out in the class schedule picker.
   */
  usage: async (
    schoolYearId: string,
    roomId?: string | null,
  ): Promise<RoomUsage[]> => {
    const res = await client.get<ApiResponse<RawUsage[]>>("/rooms/usage", {
      params: { schoolYearId, ...(roomId ? { roomId } : {}) },
    });
    return (res.data?.data ?? []).map(mapUsage);
  },
};