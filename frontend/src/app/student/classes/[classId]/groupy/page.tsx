"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { GroupyChatFeature } from "@/components/shared/groupy/GroupyChatFeature";
import { useAuth } from "@/hooks/useAuth";

export default function StudentGroupyPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Chat" />
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Class Chat" />
      <div className="rounded-lg border bg-card overflow-hidden h-[calc(100vh-12rem)]">
        <GroupyChatFeature
          classId={classId}
          role="student"
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}