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

export function exportToCsv(
  logs: { createdAt: string; actorId?: string | null; action: string; entityType?: string | null; entityId?: string | null; metadata?: Record<string, unknown> | null }[],
  filename: string,
) {
  const headers = ["Timestamp", "Actor ID", "Action", "Entity Type", "Entity ID", "Metadata"];
  const rows = logs.map((l) => [
    safeFormatDate(l.createdAt, "yyyy-MM-dd HH:mm:ss"),
    l.actorId ?? "",
    l.action,
    l.entityType ?? "",
    l.entityId ?? "",
    l.metadata ? JSON.stringify(l.metadata) : "",
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
