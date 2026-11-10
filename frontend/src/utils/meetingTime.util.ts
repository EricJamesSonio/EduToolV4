import { formatInZone } from "@/utils/datetime.util";

// Meeting times are always shown in the school timezone (ORG_TIMEZONE), never
// in the viewer's device timezone, so the time the educator set reads the same
// for everyone.

export type MeetingTimeStyle = "short" | "long";

const NO_DATE_FIELDS: Intl.DateTimeFormatOptions = {
  year: undefined,
  month: undefined,
  day: undefined,
  weekday: undefined,
};

const NO_TIME_FIELDS: Intl.DateTimeFormatOptions = {
  hour: undefined,
  minute: undefined,
};

function safe(render: () => string): string {
  try {
    return render();
  } catch {
    return "-";
  }
}

export function formatMeetingDateTime(
  iso: string,
  style: MeetingTimeStyle = "short",
): string {
  return safe(() =>
    formatInZone(iso, {
      year: "numeric",
      month: style === "long" ? "long" : "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  );
}

export function formatMeetingDate(
  iso: string,
  style: MeetingTimeStyle = "short",
): string {
  return safe(() =>
    formatInZone(iso, {
      ...NO_TIME_FIELDS,
      weekday: style === "long" ? "long" : undefined,
      year: "numeric",
      month: style === "long" ? "long" : "short",
      day: "numeric",
    }),
  );
}

export function formatMeetingTime(iso: string): string {
  return safe(() =>
    formatInZone(iso, {
      ...NO_DATE_FIELDS,
      hour: "numeric",
      minute: "2-digit",
    }),
  );
}