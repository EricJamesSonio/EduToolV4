"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Unlock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GradeLock, GradeLockStatus } from "@/types/admin/grade-lock.types"

function lockStatusVariant(
  status: GradeLockStatus
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "locked":
      return "destructive"
    case "auto_locked":
      return "outline"
    default:
      return "secondary"
  }
}

function lockStatusLabel(status: GradeLockStatus): string {
  switch (status) {
    case "locked":
      return "Locked"
    case "auto_locked":
      return "Auto-Locked"
    default:
      return "Unlocked"
  }
}

function calculateLockStatus(lock: GradeLock): GradeLockStatus {
  // Use the lockStatus field from backend if available
  if (lock.lockStatus) {
    return lock.lockStatus
  }
  // Fallback: calculate from is_locked flag
  if (lock.is_locked) {
    return lock.locked_by === "system" ? "auto_locked" : "locked"
  }
  return "unlocked"
}

export function useGradeLockColumns(
  onOverride: (lock: GradeLock) => void
): ColumnDef<GradeLock>[] {
  return useMemo<ColumnDef<GradeLock>[]>(
    () => [
      {
        accessorKey: "className",
        header: "Class",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.className || "Unknown Class"}
          </span>
        ),
      },
      {
        accessorKey: "educatorName",
        header: "Educator",
        cell: ({ row }) => (
          <span>{row.original.educatorName || "Unknown Educator"}</span>
        ),
      },
      {
        accessorKey: "semesterName",
        header: "Semester",
        cell: ({ row }) => (
          <span>{row.original.semesterName || "—"}</span>
        ),
      },
      {
        accessorKey: "termName",
        header: "Term",
        cell: ({ row }) => (
          <span>{row.original.termName || "—"}</span>
        ),
      },
      {
        id: "lockStatus",
        header: "Lock Status",
        cell: ({ row }) => {
          const status = calculateLockStatus(row.original)
          return (
            <Badge variant={lockStatusVariant(status)}>
              {lockStatusLabel(status)}
            </Badge>
          )
        },
      },
      {
        accessorKey: "deadline",
        header: "Deadline",
        cell: ({ row }) => {
          const deadline = row.original.deadline
          if (!deadline)
            return <span className="text-muted-foreground">—</span>
          return (
            <span className="tabular-nums text-sm">
              {format(new Date(deadline), "MMM d, yyyy h:mm a")}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const lock = row.original
          const status = calculateLockStatus(lock)
          const isLocked =
            status === "locked" || status === "auto_locked"

          return isLocked ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onOverride(lock)
              }}
            >
              <Unlock className="h-3.5 w-3.5" />
              Override Lock
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )
        },
      },
    ],
    [onOverride]
  )
}