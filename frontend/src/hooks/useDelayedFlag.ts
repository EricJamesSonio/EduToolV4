import { useEffect, useState } from "react"

export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [elapsed, setElapsed] = useState(delayMs <= 0)

  useEffect(() => {
    if (!active) {
      setElapsed(delayMs <= 0)
      return
    }
    if (delayMs <= 0) {
      setElapsed(true)
      return
    }
    const timer = setTimeout(() => setElapsed(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])

  return active && elapsed
}