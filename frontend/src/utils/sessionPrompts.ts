/**
 * "Show once per login session" flags, backed by sessionStorage.
 *
 * - Closing the tab/browser clears sessionStorage → fresh session.
 * - Logging out calls resetSessionPrompts() (see auth.store.ts) so the next
 *   login in the same tab starts fresh too.
 */

const PREFIX = "session-prompt:"

export const SCHOOL_PROFILE_SETUP_PROMPT = "school-profile-setup"

export function hasPromptBeenShown(key: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.sessionStorage.getItem(PREFIX + key) === "1"
  } catch {
    return false
  }
}

export function markPromptShown(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(PREFIX + key, "1")
  } catch {
    /* storage unavailable — worst case the prompt shows again */
  }
}

export function resetSessionPrompts(): void {
  if (typeof window === "undefined") return
  try {
    const stale: string[] = []
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i)
      if (k && k.startsWith(PREFIX)) stale.push(k)
    }
    stale.forEach((k) => window.sessionStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}