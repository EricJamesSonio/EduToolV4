"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Unlock, Wand2 } from "lucide-react"

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
  if (lock.lockStatus) return lock.lockStatus

  if (lock.is_locked) {
    return lock.locked_by === "system"
      ? "auto_locked"
      : "locked"
  }

  return "unlocked"
}

export function useGradeLockColumns(
  onOverride: (lock: GradeLock) => void,
  onApplyTemplate: (lock: GradeLock) => void,
  settingMap: Map<string, string>
): ColumnDef<GradeLock>[] {
  return useMemo(
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
      },

      // ✅ TEMPLATE NAME COLUMN
      {
        id: "template",
        header: "Template",
        cell: ({ row }) => {
          const templateId = row.original.setting_id

          if (!templateId) {
            return (
              <span className="text-muted-foreground">
                —
              </span>
            )
          }

          return (
            <span className="text-sm">
              {settingMap.get(templateId) ?? "Unknown Template"}
            </span>
          )
        },
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

          if (!deadline) {
            return (
              <span className="text-muted-foreground">
                —
              </span>
            )
          }

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
            status === "locked" ||
            status === "auto_locked"

          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation()
                  onApplyTemplate(lock)
                }}
              >
                <Wand2 className="h-3.5 w-3.5" />
                Apply
              </Button>

              {isLocked && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOverride(lock)
                  }}
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Override
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [onOverride, onApplyTemplate, settingMap]
  )
}