import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// All status strings used across EduTool
type StatusValue =
  // Account
  | "active"
  | "blocked"
  // Enrollment / Submission
  | "pending"
  | "submitted"
  | "draft"
  | "exempted"
  // Attendance
  | "present"
  | "absent"
  | "late"
  | "excused"
  // Grade / Academic
  | "passed"
  | "failed"
  // School Year
  | "upcoming"
  | "ended"
  | "archived"
  // Student status
  | "suspended"
  | "dropped"
  | "graduated"
  | "transferred"
  // Assessment
  | "open"
  | "closed"
  | "missed"
  // Meeting
  | "live"
  // Grade lock
  | "locked"
  | "unlocked"
  | "auto-locked"
  // Generic
  | string;

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Green — positive / active
  active:    { label: "Active",    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  present:   { label: "Present",   className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  submitted: { label: "Submitted", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  passed:    { label: "Passed",    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  open:      { label: "Open",      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  unlocked:  { label: "Unlocked",  className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },

  // Yellow/Amber — pending / in-progress
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  draft:     { label: "Draft",     className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  upcoming:  { label: "Upcoming",  className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  exempted:  { label: "Exempted",  className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },

  // Red — negative / blocked / failed
  blocked:   { label: "Blocked",   className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  dropped:   { label: "Dropped",   className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  absent:    { label: "Absent",    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  failed:    { label: "Failed",    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  closed:    { label: "Closed",    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
  missed:    { label: "Missed",    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },

  // Orange — warning / suspended / late
  suspended: { label: "Suspended", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800" },
  late:      { label: "Late",      className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800" },

  // Gray — inactive / ended / archived
  graduated: { label: "Graduated", className: "bg-muted text-muted-foreground border-border" },
  ended:     { label: "Ended",     className: "bg-muted text-muted-foreground border-border" },
  archived:  { label: "Archived",  className: "bg-muted text-muted-foreground border-border" },
  locked:    { label: "Locked",    className: "bg-muted text-muted-foreground border-border" },
  "auto-locked": { label: "Auto-Locked", className: "bg-muted text-muted-foreground border-border" },

  // Blue-gray — transferred / live
  transferred: { label: "Transferred", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700" },
  excused:     { label: "Excused",     className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700" },

  // Blue — live
  live: { label: "Live", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
};

interface StatusBadgeProps {
  status: StatusValue;
  /** Override the displayed label */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = status?.toLowerCase().trim();
  const config = STATUS_MAP[key] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize border",
        config.className,
        className
      )}
    >
      {label ?? config.label}
    </Badge>
  );
}