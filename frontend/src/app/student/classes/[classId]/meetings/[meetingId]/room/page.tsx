"use client";

import dynamic from "next/dynamic";

const StudentRoomClient = dynamic(
  () => import("./_components/StudentRoomClient"),
  { ssr: false }
);

export default function StudentMeetingRoomPage() {
  return <StudentRoomClient />;
}
