"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface AdminRoomNoticeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onBack: () => void;
}

export function AdminRoomNotice({
  icon,
  title,
  description,
  onBack,
}: AdminRoomNoticeProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 text-foreground">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={{ label: "Back to live meetings", onClick: onBack, icon: ArrowLeft }}
        className="max-w-lg"
      />
    </div>
  );
}