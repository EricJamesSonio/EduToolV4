"use client"

import { Check, Circle, Loader2, TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** One row of the seed checklist. */
export interface SeedStage {
  key: string
  label: string
  /** Keys into SeedResultData for the count buckets this stage covers. */
  resultKeys: string[]
}

export interface SeedStageCount {
  seeded: number
  already_exists: number
  skipped: number
}

export type SeedOutcome =
  | { status: "running"; stages: SeedStage[] }
  | { status: "success"; stages: SeedStage[]; result: Record<string, unknown> }
  | { status: "error"; stages: SeedStage[]; message: string }


function readCount(
  result: Record<string, unknown> | undefined,
  key: string,
): SeedStageCount | null {
  const raw = result?.[key]
  if (!raw || typeof raw !== "object") return null
  const c = raw as Record<string, unknown>
  return {
    seeded: typeof c.seeded === "number" ? c.seeded : 0,
    already_exists: typeof c.already_exists === "number" ? c.already_exists : 0,
    skipped: typeof c.skipped === "number" ? c.skipped : 0,
  }
}

function countSummary(count: SeedStageCount): string {
  const parts: string[] = []
  if (count.seeded > 0) parts.push(`${count.seeded} seeded`)
  if (count.already_exists > 0) parts.push(`${count.already_exists} already existed`)
  if (count.skipped > 0) parts.push(`${count.skipped} skipped`)
  return parts.join(" · ") || "nothing to seed"
}

interface SeedProgressDialogProps {
  outcome: SeedOutcome | null
  onClose: () => void
}

export function SeedProgressDialog({ outcome, onClose }: SeedProgressDialogProps) {
  const open = outcome !== null
  const running = outcome?.status === "running"
  const failed = outcome?.status === "error"
  const warnings =
    outcome?.status === "success"
      ? ((outcome.result?.warnings as string[] | undefined) ?? [])
      : []

  return (
    <Dialog
      open={open}
      disablePointerDismissal={running}
      onOpenChange={(next) => {
        // While the request is in flight the dialog is deliberately
        // non-dismissible so the rest of the page stays out of reach.
        if (!next && !running) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!running}>
        <DialogHeader>
          <DialogTitle>
            {running ? "Seeding your school year" : failed ? "Seeding failed" : "Seed complete"}
          </DialogTitle>
          <DialogDescription>
            {running
              ? "This can take a moment. Please keep this window open."
              : failed
                ? "Nothing was applied. See the message below."
                : "Here's what was created for this school year."}
          </DialogDescription>
        </DialogHeader>

        {failed && outcome?.status === "error" ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm">{outcome.message}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {outcome?.stages.map((stage) => {
              const count =
                outcome.status === "success"
                  ? stage.resultKeys
                      .map((k) => readCount(outcome.result, k))
                      .filter((c): c is SeedStageCount => c !== null)
                      .reduce(
                        (acc, c) => ({
                          seeded: acc.seeded + c.seeded,
                          already_exists: acc.already_exists + c.already_exists,
                          skipped: acc.skipped + c.skipped,
                        }),
                        { seeded: 0, already_exists: 0, skipped: 0 },
                      )
                  : null

              const empty = count !== null && count.seeded + count.already_exists + count.skipped === 0

              return (
                <li key={stage.key} className="flex items-center gap-2 text-sm">
                  {running ? (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  ) : empty ? (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15">
                      <Check className="h-3 w-3 text-success" />
                    </span>
                  )}
                  <span className={cn("min-w-0 flex-1 truncate", empty && "text-muted-foreground")}>
                    {stage.label}
                  </span>
                  {running && (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                  )}
                  {!running && count !== null && (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {countSummary(count)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {!running && warnings.length > 0 && (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-3">
            <p className="text-xs font-medium not-interactive">Notices</p>
            <ul className="mt-1 space-y-1">
              {warnings.slice(0, 5).map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground not-interactive">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!running && (
          <DialogFooter>
            <Button type="button" onClick={onClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
