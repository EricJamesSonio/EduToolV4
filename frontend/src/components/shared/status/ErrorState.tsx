"use client"

import { AlertCircle, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

export function ErrorState({
  title = "We couldn't load this",
  description,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps): React.JSX.Element {
  const online = useOnlineStatus()
  const Icon = online ? AlertCircle : WifiOff
  const message =
    description ??
    (online
      ? "Something went wrong on our end. Please try again in a moment."
      : "You appear to be offline. Check your connection and try again.")

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
        <Icon aria-hidden="true" className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium not-interactive">{title}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground not-interactive">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying && (
            <LoadingSpinner size="sm" centered={false} className="mr-2" />
          )}
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      )}
    </div>
  )
}