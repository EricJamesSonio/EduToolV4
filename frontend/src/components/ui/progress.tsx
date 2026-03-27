"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "@/lib/utils"

// Progress Root
const Progress: React.FC<ProgressPrimitive.Root.Props> = ({
  className,
  children,
  value,
  ...props
}) => {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

// Progress Track
const ProgressTrack: React.FC<ProgressPrimitive.Track.Props> = ({ className, ...props }) => {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
}

// Progress Indicator
const ProgressIndicator: React.FC<ProgressPrimitive.Indicator.Props> = ({ className, ...props }) => {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  )
}

// Progress Label
const ProgressLabel: React.FC<ProgressPrimitive.Label.Props> = ({ className, ...props }) => {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

// Progress Value
const ProgressValue: React.FC<ProgressPrimitive.Value.Props> = ({ className, ...props }) => {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn("ml-auto text-sm text-muted-foreground tabular-nums", className)}
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}