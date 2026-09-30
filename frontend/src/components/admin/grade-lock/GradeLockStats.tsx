import type {
  GradeLock,
  GradeLockStatus,
} from "@/types/admin/grade-lock.types";

interface GradeLockStatsProps {
  gradeLocks: GradeLock[];
}

function resolveStatus(lock: GradeLock): GradeLockStatus {
  if (lock.lockStatus) return lock.lockStatus;

  if (lock.is_locked) {
    return lock.locked_by === "system" ? "auto_locked" : "locked";
  }

  return "unlocked";
}

export function GradeLockStats({
  gradeLocks,
}: GradeLockStatsProps): React.ReactElement {
  const countOf = (status: GradeLockStatus): number =>
    gradeLocks.filter((l) => resolveStatus(l) === status).length;

  const stats = [
    { label: "Total Classes", value: gradeLocks.length, valueClass: "text-foreground" },
    { label: "Unlocked", value: countOf("unlocked"), valueClass: "text-muted-foreground" },
    { label: "Scheduled", value: countOf("scheduled"), valueClass: "text-primary" },
    { label: "Overdue", value: countOf("overdue"), valueClass: "text-warning" },
    { label: "Locked", value: countOf("locked"), valueClass: "text-destructive" },
    { label: "Auto-Locked", value: countOf("auto_locked"), valueClass: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map(({ label, value, valueClass }) => (
        <div
          key={label}
          className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/20"
        >
          <p className="text-xs text-muted-foreground not-interactive">{label}</p>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight not-interactive ${valueClass}`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}