"use client";

import { useRouter } from "next/navigation";
import { format, isPast, isWithinInterval, addMinutes } from "date-fns";
import { Calendar, Users, ArrowRight, Radio, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ListItemCardAction,
  listItemCardClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { WEEK_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/types/educator/meeting.types";

interface MeetingCardProps {
  meeting: Meeting;
  classId: string;
}

function getMeetingStatus(meeting: Meeting): "upcoming" | "live" | "ended" {
  if (meeting.status === "ended") return "ended";
  const start = new Date(meeting.startTime);
  const liveWindow = isWithinInterval(new Date(), {
    start: addMinutes(start, -15),
    end:   addMinutes(start, 180),
  });
  if (liveWindow) return "live";
  if (isPast(start)) return "ended";
  return "upcoming";
}

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", variant: "secondary" as const, className: "" },
  live:     { label: "Live",     variant: "default"   as const, className: "bg-green-600 hover:bg-green-600 text-white" },
  ended:    { label: "Ended",    variant: "outline"   as const, className: "text-muted-foreground" },
};

export function MeetingCard({ meeting, classId }: MeetingCardProps) {
  const router   = useRouter();
  const status   = getMeetingStatus(meeting);
  const config   = STATUS_CONFIG[status];
  const basePath = `/educator/classes/${classId}/meetings/${meeting.id}`;
  const colorIdx = meeting.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return (
    <div className={cn(
      listItemCardClass,
      "transition-colors",
      status === "live" && "border-green-200 bg-green-50/30"
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-2 sm:p-2.5 shrink-0", WEEK_COLORS[colorIdx % WEEK_COLORS.length])}>
          <Video className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(listItemTitleClass, "truncate")}>{meeting.title}</p>
            <Badge variant={config.variant} className={cn("text-xs font-normal shrink-0", config.className)}>
              {config.label}
            </Badge>
          </div>
          {meeting.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {meeting.description}
            </p>
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {format(new Date(meeting.startTime), "MMM d, yyyy · h:mm a")}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" />
          {meeting.invites.length} invited
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {status === "live" && (
          <ListItemCardAction
            icon={Radio}
            label="Enter Room"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => router.push(`${basePath}/room`)}
          />
        )}
        <ListItemCardAction
          icon={ArrowRight}
          label="View"
          onClick={() => router.push(basePath)}
        />
      </div>
    </div>
  );
}
