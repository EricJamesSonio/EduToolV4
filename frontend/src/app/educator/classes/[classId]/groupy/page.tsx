"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { GroupyChatFeature } from "@/components/shared/groupy/GroupyChatFeature";
import { useAuthStore } from "@/store/auth.store";

interface Props {
  params: Promise<{ classId: string }>;
}

export default function EducatorGroupyPage({ params }: Props): React.JSX.Element {
  const { classId } = use(params);
  const user = useAuthStore((s) => s.user);

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
          role="educator"
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}