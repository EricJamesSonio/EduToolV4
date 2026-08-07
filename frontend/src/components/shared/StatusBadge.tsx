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
  active:    { label: "Active",    className: "badge-active" },
  present:   { label: "Present",   className: "badge-active" },
  submitted: { label: "Submitted", className: "badge-active" },
  passed:    { label: "Passed",    className: "badge-active" },
  open:      { label: "Open",      className: "badge-active" },
  approved:  { label: "Approved",  className: "badge-active" },
  unlocked:  { label: "Unlocked",  className: "badge-active" },

  // Yellow/Amber — pending / in-progress
  pending:   { label: "Pending",   className: "badge-pending" },
  draft:     { label: "Draft",     className: "badge-pending" },
  upcoming:  { label: "Upcoming",  className: "badge-pending" },
  exempted:  { label: "Exempted",  className: "badge-pending" },

  // Red — negative / blocked / failed
  blocked:   { label: "Blocked",   className: "badge-suspended" },
  dropped:   { label: "Dropped",   className: "badge-suspended" },
  absent:    { label: "Absent",    className: "badge-suspended" },
  failed:    { label: "Failed",    className: "badge-suspended" },
  rejected:  { label: "Rejected",  className: "badge-suspended" },
  closed:    { label: "Closed",    className: "badge-suspended" },
  missed:    { label: "Missed",    className: "badge-suspended" },

  // Orange — warning / suspended / late
  suspended: { label: "Suspended", className: "badge-suspended" },
  late:      { label: "Late",      className: "badge-pending" },

  // Gray — inactive / ended / archived
  graduated: { label: "Graduated", className: "bg-muted text-muted-foreground border-border" },
  ended:     { label: "Ended",     className: "bg-muted text-muted-foreground border-border" },
  archived:  { label: "Archived",  className: "bg-muted text-muted-foreground border-border" },
  locked:    { label: "Locked",    className: "bg-muted text-muted-foreground border-border" },
  "auto-locked": { label: "Auto-Locked", className: "bg-muted text-muted-foreground border-border" },

  // Blue-gray — transferred / excused
  transferred: { label: "Transferred", className: "badge-transferred" },
  excused:     { label: "Excused",     className: "badge-transferred" },

  // Blue — live
  live: { label: "Live", className: "badge-info" },
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