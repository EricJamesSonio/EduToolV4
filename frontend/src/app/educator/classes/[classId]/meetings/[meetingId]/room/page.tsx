"use client";

import dynamic from "next/dynamic";

const RoomClient = dynamic(
  () => import("./_components/RoomClient"),
  { ssr: false }
);

export default function EducatorMeetingRoomPage() {
  return <RoomClient />;
}