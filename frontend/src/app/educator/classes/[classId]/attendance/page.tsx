"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader";
import { AttendanceGrid } from "@/components/educator/attendance/AttendanceGrid";

export default function AttendancePage() {
  const { classId } = useParams<{ classId: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Record and track attendance for this class."
      />

      <AttendanceGrid classId={classId} />
    </div>
  );
}