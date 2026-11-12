"use client"

import type { ReactNode } from "react"
import { LoadingScreen } from "@/components/shared/loading/LoadingScreen"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { useServerWake } from "@/hooks/useServerWake"

const OFFLINE_MESSAGE = {
  title: "You are offline",
  hint: "Reconnect to the internet and this page will open on its own.",
}

function wakeMessage(elapsedMs: number): { title: string; hint: string } {
  if (elapsedMs < 6_000) {
    return {
      title: "Waking up the server",
      hint: "Getting everything ready for you.",
    }
  }
  if (elapsedMs < 25_000) {
    return {
      title: "Waking up the server",
      hint: "This can take a while sometimes. Thanks for waiting.",
    }
  }
  return {
    title: "Still waking up",
    hint: "The server can take up to a minute to start after being idle. Hang tight, this page will open on its own.",
  }
}

export function ServerWakeGate({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  const { status, elapsedMs } = useServerWake()
  const online = useOnlineStatus()

  if (status === "ready") return <>{children}</>

  const { title, hint } = online ? wakeMessage(elapsedMs) : OFFLINE_MESSAGE

  return (
    <LoadingScreen
      status={title}
      hint={hint}
      delayMs={250}
      animateDots={online}
    />
  )
}