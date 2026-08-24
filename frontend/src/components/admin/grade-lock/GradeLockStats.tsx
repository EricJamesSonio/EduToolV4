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
    return lock.locked_by === "system"
      ? "auto_locked"
      : "locked";
  }

  return "unlocked";
}

export function GradeLockStats({
  gradeLocks,
}: GradeLockStatsProps): React.ReactElement {
  const counts = {
    total: gradeLocks.length,
    unlocked: gradeLocks.filter(
      (l) => resolveStatus(l) === "unlocked"
    ).length,
    locked: gradeLocks.filter(
      (l) => resolveStatus(l) === "locked"
    ).length,
    autoLocked: gradeLocks.filter(
      (l) => resolveStatus(l) === "auto_locked"
    ).length,
  };

  const stats = [
    {
      label: "Total Classes",
      value: counts.total,
      valueClass: "text-foreground",
    },
    {
      label: "Unlocked",
      value: counts.unlocked,
      valueClass: "text-muted-foreground",
    },
    {
      label: "Locked",
      value: counts.locked,
      valueClass: "text-destructive",
    },
    {
      label: "Auto-Locked",
      value: counts.autoLocked,
      valueClass: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, valueClass }) => (
        <div
          key={label}
          className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/20"
        >
          <p className="text-xs text-muted-foreground not-interactive">
            {label}
          </p>

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