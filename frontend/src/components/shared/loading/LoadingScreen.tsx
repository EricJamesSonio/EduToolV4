"use client"

import { GraduationCap } from "lucide-react"
import { useDelayedFlag } from "@/hooks/useDelayedFlag"

interface LoadingScreenProps {
  status: string
  hint?: string
  delayMs?: number
}

export function LoadingScreen({
  status,
  hint,
  delayMs = 0,
}: LoadingScreenProps): React.JSX.Element | null {
  const visible = useDelayedFlag(true, delayMs)

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground"
    >
      <div className="relative flex h-20 w-20 items-center justify-center text-primary">
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none"
        />
        <GraduationCap aria-hidden="true" className="h-8 w-8" strokeWidth={2} />
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Relief-ED
        </h1>
        <p className="text-sm font-medium">{status}</p>
      </div>

      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}