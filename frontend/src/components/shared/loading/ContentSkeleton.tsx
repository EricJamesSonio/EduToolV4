"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useDelayedFlag } from "@/hooks/useDelayedFlag"

export type ContentSkeletonVariant = "cards" | "list" | "table" | "detail"

interface ContentSkeletonProps {
  variant?: ContentSkeletonVariant
  rows?: number
  label?: string
  delayMs?: number
  className?: string
}

const DEFAULT_ROWS: Record<ContentSkeletonVariant, number> = {
  cards: 3,
  list: 5,
  table: 6,
  detail: 1,
}

export function ContentSkeleton({
  variant = "cards",
  rows,
  label = "Loading content",
  delayMs = 150,
  className,
}: ContentSkeletonProps): React.JSX.Element | null {
  const visible = useDelayedFlag(true, delayMs)

  if (!visible) return null

  const count = rows ?? DEFAULT_ROWS[variant]
  const items = Array.from({ length: count }, (_, index) => index)
  let body: ReactNode

  if (variant === "cards") {
    body = (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <Skeleton key={item} className="h-32 rounded-lg" />
        ))}
      </div>
    )
  } else if (variant === "list") {
    body = (
      <div className="space-y-2">
        {items.map((item) => (
          <Skeleton key={item} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  } else if (variant === "table") {
    body = (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-md" />
        {items.map((item) => (
          <Skeleton key={item} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  } else {
    body = (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("w-full", className)}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{body}</div>
    </div>
  )
}