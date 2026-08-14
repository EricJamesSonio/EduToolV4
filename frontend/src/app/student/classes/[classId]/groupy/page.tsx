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
    <div className="flex h-[calc(100vh-76px-3rem)] flex-col overflow-x-hidden">
      <div className="shrink-0">
        <PageHeader title="Class Chat" />
      </div>
      <div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden">
        <GroupyChatFeature
          classId={classId}
          role="student"
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}