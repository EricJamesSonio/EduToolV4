// ===== File: frontend\src\hooks\admin\useConcernColumns.tsx =====
"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

import type { StaffConcernRow } from "@/api/admin/concern.api";

function lastActivity(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

export function useConcernColumns(): ColumnDef<StaffConcernRow>[] {
  return useMemo<ColumnDef<StaffConcernRow>[]>(
    () => [
      {
        id: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{row.original.subject}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.messages?.[0]?.body}
            </span>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.category?.label ?? "—"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "senderRole",
        header: "Sender",
        cell: ({ row }) => <span className="capitalize text-sm">{row.original.sender_role}</span>,
      },
      {
        id: "lastActivity",
        header: "Last Activity",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {lastActivity(row.original.last_message_at)}
          </span>
        ),
      },
    ],
    [],
  );
}