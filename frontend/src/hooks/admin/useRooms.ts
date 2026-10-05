import { useMutationWithInvalidation, useAsyncQuery } from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { roomApi } from "@/api/admin/room.api";
import type { Room } from "@/types/admin/room.types";

/**
 * The org's rooms. Pass a schoolYearId to also get each room's slotCount for
 * that year (one grouped server query, not one request per room).
 *
 * Cached generously: the list only changes when someone edits the Rooms page.
 */
export function useRooms(schoolYearId?: string | null) {
  return useAsyncQuery(
    adminQueryKeys.rooms.list(schoolYearId),
    () => roomApi.list(schoolYearId),
    { enabled: true, staleTime: 60_000 },
  );
}

/**
 * Every room's bookings in a school year — or one room's when roomId is given.
 * Stale quickly: this is the data behind the "already booked" grey-out in the
 * class schedule picker, so a fresh answer matters more than a cached one.
 */
export function useRoomUsage(schoolYearId?: string | null, roomId?: string | null) {
  return useAsyncQuery(
    adminQueryKeys.rooms.usage(schoolYearId ?? "", roomId),
    () => roomApi.usage(schoolYearId!, roomId ?? undefined),
    { enabled: !!schoolYearId, staleTime: 15_000 },
  );
}

export function useCreateRoom() {
  return useMutationWithInvalidation((name: string) => roomApi.create(name), {
    invalidateKeys: [adminQueryKeys.rooms.all],
  });
}

export function useRenameRoom() {
  return useMutationWithInvalidation(
    ({ id, name }: { id: string; name: string }) => roomApi.rename(id, name),
    { invalidateKeys: [adminQueryKeys.rooms.all] },
  );
}

export function useDeleteRoom() {
  return useMutationWithInvalidation((id: string) => roomApi.remove(id), {
    invalidateKeys: [adminQueryKeys.rooms.all],
  });
}

export type { Room };