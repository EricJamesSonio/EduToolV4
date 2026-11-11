"use client"

import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

export function OfflineBanner(): React.JSX.Element | null {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 border-b border-warning bg-warning px-4 py-2 text-sm font-medium text-[color:var(--warning-foreground)]"
    >
      <WifiOff aria-hidden="true" className="h-4 w-4" />
      <span>You are offline. Changes can't be saved until you reconnect.</span>
    </div>
  )
}