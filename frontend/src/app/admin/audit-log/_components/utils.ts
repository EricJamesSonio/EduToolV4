import { format } from "date-fns";

export function actionBadgeVariant(
  action: string
): "default" | "destructive" | "secondary" | "outline" {
  const a = action.toLowerCase();
  if (a.includes("unlock") || a.includes("override") || a.includes("deleted") || a.includes("removed"))
    return "destructive";
  if (a.includes("lock"))
    return "outline";
  if (a.includes("created") || a.includes("started") || a.includes("published") || a.includes("completed"))
    return "default";
  return "secondary";
}

export function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function safeFormatDate(dateString: string, formatStr: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return format(date, formatStr);
  } catch {
    return "Invalid date";
  }
}

// ── Human-readable names and details ─────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T|$)/;

/** "schoolYearId" / "school_year" -> "School year". */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** "school_year" -> "School year". */
export function formatEntityType(type?: string | null): string {
  return type ? humanizeKey(type) : "Item";
}

/** Best-effort name saved in the log itself, for items that no longer exist. */
export function nameFromMetadata(metadata?: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  for (const key of ["name", "title", "fullName", "label"]) {
    const v = metadata[key];
    if (typeof v === "string" && v.trim() && !UUID_RE.test(v)) return v;
  }
  return null;
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (UUID_RE.test(value)) return null; // raw IDs mean nothing to a person
    if (ISO_DATE_RE.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return format(d, value.includes("T") ? "MMM d, yyyy h:mm a" : "MMM d, yyyy");
      }
    }
    return /^[a-z]+(_[a-z]+)+$/.test(value) ? value.replace(/_/g, " ") : value;
  }
  if (Array.isArray(value)) {
    const parts = value.map(formatValue).filter((p): p is string => p !== null);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (typeof value === "object") {
    const inner = getMetadataEntries(value as Record<string, unknown>).map(
      (e) => `${e.label}: ${e.value}`,
    );
    return inner.length > 0 ? inner.join("; ") : null;
  }
  return String(value);
}

export interface MetadataEntry {
  label: string;
  value: string;
}

/** Turns raw metadata into labelled, readable rows. IDs and empty values are dropped. */
export function getMetadataEntries(
  metadata?: Record<string, unknown> | null,
): MetadataEntry[] {
  if (!metadata) return [];
  const entries: MetadataEntry[] = [];
  for (const [key, raw] of Object.entries(metadata)) {
    const value = formatValue(raw);
    if (value !== null) entries.push({ label: humanizeKey(key), value });
  }
  return entries;
}

export function exportToCsv(
  logs: {
    createdAt: string;
    actorId?: string | null;
    actorName?: string | null;
    actorRole?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    entityName?: string | null;
    metadata?: Record<string, unknown> | null;
  }[],
  filename: string,
) {
  const headers = ["Timestamp", "Actor", "Role", "Action", "Target Type", "Target", "Details", "Actor ID", "Target ID"];
  const rows = logs.map((l) => [
    safeFormatDate(l.createdAt, "yyyy-MM-dd HH:mm:ss"),
    l.actorName ?? "",
    l.actorRole ?? "",
    formatActionLabel(l.action),
    formatEntityType(l.entityType),
    l.entityName ?? nameFromMetadata(l.metadata) ?? "",
    getMetadataEntries(l.metadata).map((e) => `${e.label}: ${e.value}`).join("; "),
    l.actorId ?? "",
    l.entityId ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}