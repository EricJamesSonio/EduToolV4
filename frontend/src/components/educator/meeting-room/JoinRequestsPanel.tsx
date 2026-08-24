"use client";

import { Check, X } from "lucide-react";
import type { EnrolledStudent } from "@/types/educator/meeting.types";

interface JoinRequest {
  id: string;
  studentId: string;
}

interface JoinRequestsPanelProps {
  requests: JoinRequest[];
  students: EnrolledStudent[];
  onRespond: (reqId: string, status: "accepted" | "declined") => void;
  isPending: boolean;
}

export function JoinRequestsPanel({ requests, students, onRespond, isPending }: JoinRequestsPanelProps) {
  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No pending join requests
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto h-full">
      {requests.map((req) => {
        const student = students.find((s) => s.id === req.studentId);
        return (
          <div key={req.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{student?.fullName ?? "Unknown Student"}</p>
              {student?.email && (
                <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => onRespond(req.id, "accepted")}
                disabled={isPending}
                className="h-7 w-7 flex items-center justify-center rounded-md text-success hover:bg-success/10 transition-colors disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRespond(req.id, "declined")}
                disabled={isPending}
                className="h-7 w-7 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}