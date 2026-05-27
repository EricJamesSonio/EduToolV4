"use client";

import { useRouter } from "next/navigation";
import { format, isPast, isWithinInterval, addMinutes } from "date-fns";
import { Calendar, Users, ArrowRight, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/types/educator/meeting.types";

interface MeetingCardProps {
  meeting: Meeting;
  classId: string;
}

function getMeetingStatus(meeting: Meeting): "upcoming" | "live" | "ended" {
  if (meeting.status === "ended") return "ended";
  const start = new Date(meeting.startTime);
  // Consider "live" if within 15 min before or 3 hours after start
  const liveWindow = isWithinInterval(new Date(), {
    start: addMinutes(start, -15),
    end:   addMinutes(start, 180),
  });
  if (liveWindow) return "live";
  if (isPast(start)) return "ended";
  return "upcoming";
}

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", variant: "secondary"    as const, className: "" },
  live:     { label: "Live",     variant: "default"      as const, className: "bg-green-600 hover:bg-green-600 text-white" },
  ended:    { label: "Ended",    variant: "outline"      as const, className: "text-muted-foreground" },
};

export function MeetingCard({ meeting, classId }: MeetingCardProps) {
  const router   = useRouter();
  const status   = getMeetingStatus(meeting);
  const config   = STATUS_CONFIG[status];
  const basePath = `/educator/classes/${classId}/meetings/${meeting.id}`;

  return (
    <div className={cn(
      "rounded-xl border bg-card px-6 py-4 transition-colors",
      status === "live" && "border-green-200 bg-green-50/30"
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            {status === "live" && (
              <Radio className="h-3.5 w-3.5 text-green-600 animate-pulse shrink-0" />
            )}
            <p className="font-semibold text-base truncate">{meeting.title}</p>
            <Badge variant={config.variant} className={cn("text-xs font-normal shrink-0", config.className)}>
              {config.label}
            </Badge>
          </div>

          {meeting.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {meeting.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {format(new Date(meeting.startTime), "MMM d, yyyy · h:mm a")}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {meeting.invites.length} invited
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {status === "live" && (
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => router.push(`${basePath}/room`)}
            >
              <Radio className="h-3.5 w-3.5" />
              Enter Room
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => router.push(basePath)}
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}