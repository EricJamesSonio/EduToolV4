import { SearchX } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

interface NoResultsStateProps {
  onClearFilters?: () => void
  title?: string
  description?: string
  className?: string
}

export function NoResultsState({
  onClearFilters,
  title = "No results match your filters",
  description = "Try changing or clearing your filters to see more.",
  className,
}: NoResultsStateProps) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      action={
        onClearFilters
          ? { label: "Clear filters", onClick: onClearFilters }
          : undefined
      }
      className={className ?? "min-h-[240px] md:min-h-[240px]"}
    />
  )
}