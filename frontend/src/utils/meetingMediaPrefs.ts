const STORAGE_KEY = "meeting:media-prefs";

export interface MeetingMediaPrefs {
  micOn: boolean;
  camOn: boolean;
}

function defaultPrefs(): MeetingMediaPrefs {
  return { micOn: true, camOn: true };
}

export function readMeetingMediaPrefs(): MeetingMediaPrefs {
  if (typeof window === "undefined") return defaultPrefs();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrefs();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return defaultPrefs();

    const record = parsed as Record<string, unknown>;
    return {
      micOn: typeof record.micOn === "boolean" ? record.micOn : true,
      camOn: typeof record.camOn === "boolean" ? record.camOn : true,
    };
  } catch {
    return defaultPrefs();
  }
}

export function writeMeetingMediaPrefs(patch: Partial<MeetingMediaPrefs>): void {
  if (typeof window === "undefined") return;

  try {
    const next: MeetingMediaPrefs = { ...readMeetingMediaPrefs(), ...patch };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode / quota) - ignore */
  }
}