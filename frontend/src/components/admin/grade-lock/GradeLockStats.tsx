import type { GradeLock } from "@/types/admin/grade-lock.types";

interface GradeLockStatsProps {
  gradeLocks: GradeLock[];
}

export function GradeLockStats({
  gradeLocks,
}: GradeLockStatsProps): React.ReactElement {
  const counts = {
    total:      gradeLocks.length,
    unlocked:   gradeLocks.filter((l) => l.lockStatus === "unlocked").length,
    locked:     gradeLocks.filter((l) => l.lockStatus === "locked").length,
    autoLocked: gradeLocks.filter((l) => l.lockStatus === "auto_locked").length,
  };

  const stats = [
    { label: "Total Classes",  value: counts.total,      colorClass: "" },
    { label: "Unlocked",       value: counts.unlocked,   colorClass: "text-muted-foreground" },
    { label: "Locked",         value: counts.locked,     colorClass: "text-destructive" },
    { label: "Auto-Locked",    value: counts.autoLocked, colorClass: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, colorClass }) => (
        <div key={label} className="rounded-md bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-medium ${colorClass}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}