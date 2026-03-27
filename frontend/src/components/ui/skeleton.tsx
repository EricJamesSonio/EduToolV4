import { cn } from "@/lib/utils"
import React from "react"

function Skeleton({ className, ...props }: React.ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }