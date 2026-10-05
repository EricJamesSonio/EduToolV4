"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useRooms, useRoomUsage } from "@/hooks/admin/useRooms";
import { toArray } from "@/utils/classes.utils";
import { roomUsageToClasses } from "@/utils/roomSchedule.utils";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { Class } from "@/types/admin/class.types";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { SchedulePanel } from "@/components/shared/SchedulePanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface RoomSchedulePageProps {
  params: Promise<{ roomId: string }>;
}

/**
 * A room's week, reusing the same grid the class dialog uses. Usage rows are
 * mapped into minimal Class shells because the grid is typed to Class[] — it
 * only ever reads `schedules`, `id`, `subjectName` and `sectionName`.
 */
function RoomSchedulePageInner({ params }: RoomSchedulePageProps): React.JSX.Element {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const router = useRouter();

  // params is a Promise in the App Router; read it once into state.
  useEffect(() => {
    let active = true;
    params.then((p) => {
      if (active) setRoomId(p.roomId);
    });
    return () => {
      active = false;
    };
  }, [params]);

  const { data: schoolYearsRaw, isLoading: isSchoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );
  const schoolYears = toArray<SchoolYear>(schoolYearsRaw);

  const { data: roomsRaw } = useRooms();
  const rooms = toArray<{ id: string; name: string }>(roomsRaw);
  const room = rooms.find((r) => r.id === roomId);

  const { data: usage, isLoading } = useRoomUsage(selectedSchoolYearId, roomId);

  const gridClasses = useMemo<Class[]>(
    () => roomUsageToClasses(usage ?? [], selectedSchoolYearId ?? ""),
    [usage, selectedSchoolYearId],
  );

  const bookingCount = usage?.length ?? 0;
  const hasBookings = bookingCount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={room?.name ?? "Room"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: "Rooms", href: "/admin/rooms" },
          { label: room?.name ?? "Schedule" },
        ]}
        description={
          hasBookings
            ? `${bookingCount} booking${bookingCount === 1 ? "" : "s"} this year.`
            : "No classes are scheduled in this room this year."
        }
        actions={
          <div className="flex items-center gap-2">
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={isSchoolYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/admin/rooms")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All rooms
            </Button>
          </div>
        }
      />

      {/* SchedulePanel is the shared read-only timetable: it owns the school's
          operating window (from org schedule config), the loading and empty
          states, and Mon-Sun coverage. Passing window props here instead would
          re-introduce the per-page window that this component exists to avoid. */}
      <div className="rounded-xl border bg-card p-4">
        <SchedulePanel
          classes={gridClasses}
          isLoading={isLoading || !roomId}
          getSublabel={(cls) => cls.sectionName ?? cls.educatorName ?? ""}
          emptyTitle="This room is free all week"
          emptyDescription={`No classes are scheduled in ${room?.name ?? "this room"} for the selected school year. Assign one from a class schedule.`}
        />
      </div>
    </div>
  );
}

export default function RoomSchedulePage({ params }: RoomSchedulePageProps): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <RoomSchedulePageInner params={params} />
    </Suspense>
  );
}