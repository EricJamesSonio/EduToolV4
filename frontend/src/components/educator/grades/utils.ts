export function gradeColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-success dark:text-success";
  if (score >= 75) return "text-info dark:text-info";
  if (score >= 60) return "text-warning dark:text-warning";
  return "text-destructive";
}

export function fmt(n: number | null, decimals = 1): string {
  if (n === null) return "—";
  return n.toFixed(decimals);
}
