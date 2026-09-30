"use client";

import { Suspense, useState } from "react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { DoorOpen, Plus } from "lucide-react";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useRooms, useDeleteRoom } from "@/hooks/admin/useRooms";
import { toArray } from "@/utils/classes.utils";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { Room } from "@/types/admin/room.types";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { RoomCard } from "@/components/admin/room/RoomCard";
import { RoomNameDialog } from "@/components/admin/room/RoomNameDialog";

function RoomsPageInner(): React.JSX.Element {
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const { data: schoolYearsRaw, isLoading: isSchoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );
  const schoolYears = toArray<SchoolYear>(schoolYearsRaw);

  // Passing the school year returns each room's live slotCount in the same
  // response, so the cards need no per-room request.
  const { data: roomsRaw, isLoading, isError } = useRooms(selectedSchoolYearId);
  const rooms = toArray<Room>(roomsRaw);

  const deleteRoom = useDeleteRoom();

  const handleDelete = (): void => {
    if (!deleteTarget) return;
    deleteRoom.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        // A room still booked by a live class returns 409 with the slot count.
        const message = (err as AxiosError<{ message: string }>)?.response?.data?.message;
        toast.error(message ?? "Failed to delete room.");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: "Rooms" },
        ]}
        description="Assign rooms to class schedule slots and check a room's weekly bookings."
        actions={
          <div className="flex items-center gap-2">
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={isSchoolYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
            <Button size="sm" onClick={() => setNameDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add room
            </Button>
          </div>
        }
      />

      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={rooms.length === 0}
        empty={{
          icon: DoorOpen,
          title: "No rooms yet",
          description:
            "Rooms are optional. Add one to assign it to class schedule slots.",
          action: { label: "Add room", onClick: () => setNameDialogOpen(true) },
        }}
        loading={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onRename={(r) => setRenameTarget(r)}
              onDelete={(r) => setDeleteTarget(r)}
            />
          ))}
        </div>
      </AsyncListState>

      <RoomNameDialog
        open={nameDialogOpen}
        onClose={() => setNameDialogOpen(false)}
      />
      <RoomNameDialog
        open={!!renameTarget}
        room={renameTarget}
        onClose={() => setRenameTarget(null)}
      />

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this room?"
          message={`Delete "${deleteTarget.name}"? Classes scheduled in it must be reassigned first.`}
          confirmLabel="Delete room"
          destructive
          isLoading={deleteRoom.isPending}
          onConfirm={handleDelete}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default function RoomsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <RoomsPageInner />
    </Suspense>
  );
}