"use client";

import dynamic from "next/dynamic";

const AdminLiveRoomClient = dynamic(
  () => import("./_components/AdminLiveRoomClient"),
  { ssr: false }
);

export default function LiveMeetingRoomPage() {
  return (
    <div className="dark meeting-theme contents">
      <AdminLiveRoomClient />
    </div>
  );
}