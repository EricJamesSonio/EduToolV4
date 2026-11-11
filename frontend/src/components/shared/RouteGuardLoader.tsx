"use client"

import { useEffect, useState } from "react"
import { LoadingScreen } from "@/components/shared/loading/LoadingScreen"

const STEPS = [
  "Starting up",
  "Checking your session",
  "Loading your workspace",
] as const

const STEP_INTERVAL_MS = 2500
const SLOW_AFTER_MS = 8000

export function RouteGuardLoader({
  label,
}: {
  label?: string
}): React.JSX.Element {
  const [step, setStep] = useState(0)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1))
    }, STEP_INTERVAL_MS)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => {
      clearInterval(stepTimer)
      clearTimeout(slowTimer)
    }
  }, [])

  return (
    <LoadingScreen
      status={label ?? `${STEPS[step]}...`}
      hint={
        slow
          ? "The server is taking longer than usual to wake up. This page will continue on its own."
          : undefined
      }
      delayMs={200}
    />
  )
}