"use client"

import { useState } from "react"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditableItemRowProps {
  label: string
  subtitle?: string
  onRename: (newLabel: string) => void
  onDelete: () => void
  disabled?: boolean
  className?: string
}

export function EditableItemRow({
  label,
  subtitle,
  onRename,
  onDelete,
  disabled = false,
  className,
}: EditableItemRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== label) onRename(trimmed)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(label)
    setEditing(false)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-background px-3 py-2",
        className,
      )}
    >
      {editing ? (
        <>
          <Input
            autoFocus
            value={draft}
            disabled={disabled}
            className="h-8 text-sm"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") cancel()
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-emerald-600 hover:bg-emerald-500/10"
            onClick={commit}
            disabled={disabled}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted"
            onClick={cancel}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium not-interactive">{label}</p>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground not-interactive">{subtitle}</p>
            )}
          </div>
          {!disabled && (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
                disabled={disabled}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                disabled={disabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}