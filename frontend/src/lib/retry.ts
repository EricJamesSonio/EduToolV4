export function backoffDelay(
  attempt: number,
  baseMs = 1000,
  maxMs = 30000,
): number {
  const exponential = Math.min(baseMs * 2 ** attempt, maxMs)
  const jitter = exponential * 0.2 * Math.random()
  return Math.round(exponential + jitter)
}

const TRANSIENT_STATUSES = new Set([408, 429, 502, 503, 504])

export function isTransientError(error: unknown): boolean {
  const candidate = error as {
    code?: string
    message?: string
    response?: { status?: number }
  }
  const status = candidate?.response?.status
  if (status !== undefined) return TRANSIENT_STATUSES.has(status)
  if (candidate?.code === "ERR_NETWORK") return true
  if (candidate?.code === "ECONNABORTED") return true
  return candidate?.message === "Network Error"
}