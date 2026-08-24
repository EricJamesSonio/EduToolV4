// ===== File: frontend\src\components\admin\grade-lock\GradeLockUnlockRequestsPanel.tsx =====
"use client";

import { format } from "date-fns";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UnlockRequest } from "@/types/admin/grade-lock.types";

interface GradeLockUnlockRequestsPanelProps {
  requests: UnlockRequest[];
  onGrant: (request: UnlockRequest) => void;
  onDeny: (request: UnlockRequest) => void;
}

export function GradeLockUnlockRequestsPanel({
  requests,
  onGrant,
  onDeny,
}: GradeLockUnlockRequestsPanelProps): React.ReactElement | null {
  if (requests.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
        <FileText className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Pending Unlock Requests ({requests.length})</h3>
      </div>
      <div className="divide-y">
        {requests.map((req) => (
          <div key={req.id} className="flex items-start gap-4 px-5 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{req.className}</p>
              <p className="text-xs text-muted-foreground">Educator: {req.educatorName}</p>
              <p className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
              </p>
              <p className="text-sm text-muted-foreground mt-1 italic">&ldquo;{req.reason}&rdquo;</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDeny(req)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Deny
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => onGrant(req)}>
                <CheckCircle className="h-3.5 w-3.5" />
                Grant
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}