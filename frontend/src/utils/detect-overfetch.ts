const callLog = new Map<string, number[]>();
const warningLog: string[] = [];

export function getOverfetchWarnings(): string[] {
  return warningLog;
}

export function clearOverfetchWarnings(): void {
  warningLog.length = 0;
}

export function trackApiCall(endpoint: string): void {
  const now = Date.now();
  const calls = callLog.get(endpoint) ?? [];
  const recent = calls.filter(t => now - t < 5000);
  recent.push(now);
  callLog.set(endpoint, recent);

  if (recent.length > 3) {
    const msg = `⚠️ Overfetch: ${endpoint} called ${recent.length}x in 5s`;
    console.warn(`[API] ${msg}`);
    warningLog.push(msg);
  }

  if (recent.length > 5 && process.env.NODE_ENV === 'development') {
    throw new Error(
      `[API] 🚨 Overfetch critical: ${endpoint} called ${recent.length}x in 5s. ` +
      `Fix caching or reduce polling.`
    );
  }
}

export function getCallFrequency(endpoint: string): number {
  const now = Date.now();
  const calls = callLog.get(endpoint) ?? [];
  return calls.filter(t => now - t < 5000).length;
}

export function getAllTrackedEndpoints(): Array<{ endpoint: string; callsIn5s: number }> {
  const now = Date.now();
  const result: Array<{ endpoint: string; callsIn5s: number }> = [];
  for (const [endpoint, timestamps] of callLog.entries()) {
    const recent = timestamps.filter(t => now - t < 5000);
    if (recent.length > 0) {
      result.push({ endpoint, callsIn5s: recent.length });
    }
  }
  return result.sort((a, b) => b.callsIn5s - a.callsIn5s);
}
