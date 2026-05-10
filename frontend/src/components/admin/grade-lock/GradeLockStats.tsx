import type { GradeLock, GradeLockStatus } from "@/types/admin/grade-lock.types"

interface GradeLockStatsProps {
  gradeLocks: GradeLock[]
}

function resolveStatus(lock: GradeLock): GradeLockStatus {
  if (lock.lockStatus) return lock.lockStatus
  if (lock.is_locked) {
    return lock.locked_by === "system" ? "auto_locked" : "locked"
  }
  return "unlocked"
}

export function GradeLockStats({
  gradeLocks,
}: GradeLockStatsProps): React.ReactElement {
  const counts = {
    total: gradeLocks.length,
    unlocked: gradeLocks.filter((l) => resolveStatus(l) === "unlocked").length,
    locked: gradeLocks.filter((l) => resolveStatus(l) === "locked").length,
    autoLocked: gradeLocks.filter((l) => resolveStatus(l) === "auto_locked").length,
  }

  const stats = [
    { label: "Total Classes", value: counts.total, colorClass: "", borderClass: "border-primary" },
    { label: "Unlocked", value: counts.unlocked, colorClass: "text-muted-foreground", borderClass: "border-border" },
    { label: "Locked", value: counts.locked, colorClass: "text-destructive", borderClass: "border-destructive" },
    { label: "Auto-Locked", value: counts.autoLocked, colorClass: "text-amber-600 dark:text-amber-400", borderClass: "border-amber-500" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ label, value, colorClass, borderClass }) => (
        <div key={label} className={`border-2 ${borderClass} bg-card p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${colorClass}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}