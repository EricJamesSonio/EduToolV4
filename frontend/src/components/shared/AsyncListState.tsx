"use client"

import type { ReactNode } from "react"
import { isValidElement } from "react"
import type { LucideIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { ContentSkeleton } from "@/components/shared/loading/ContentSkeleton"
import { ErrorState } from "@/components/shared/status/ErrorState"
import { NoResultsState } from "@/components/shared/status/NoResultsState"

interface EmptyConfig {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

interface AsyncListStateProps {
  /** True only while there is no data yet and a fetch is in-flight. */
  isLoading: boolean
  /** True when the fetch settled with an error. */
  isError: boolean
  /** True when the fetch confirmed there is nothing to show. */
  isEmpty: boolean
  /** Custom loading fallback. Defaults to a card skeleton grid. */
  loading?: ReactNode
  /** Empty-state config, or a custom React node to render when empty. */
  empty: EmptyConfig | ReactNode
  /** Retry handler for the error state, usually the query's refetch. */
  onRetry?: () => void
  /** True while a retry is in-flight. */
  isRetrying?: boolean
  /** True when filters or search are active, so empty means no matches. */
  isFiltered?: boolean
  /** Clears the active filters from the no-results state. */
  onClearFilters?: () => void
  errorTitle?: string
  errorDescription?: string
  children: ReactNode
}

/**
 * Single source of truth for async list states:
 * loading, then error, then no-results or empty, then content.
 */
export function AsyncListState({
  isLoading,
  isError,
  isEmpty,
  loading,
  empty,
  onRetry,
  isRetrying,
  isFiltered,
  onClearFilters,
  errorTitle,
  errorDescription,
  children,
}: AsyncListStateProps) {
  if (isLoading) {
    return <>{loading ?? <ContentSkeleton variant="cards" />}</>
  }

  if (isError) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    )
  }

  if (isEmpty) {
    if (isFiltered) {
      return <NoResultsState onClearFilters={onClearFilters} />
    }
    if (isValidElement(empty)) return empty
    return (
      <EmptyState
        icon={(empty as EmptyConfig).icon}
        title={(empty as EmptyConfig).title}
        description={(empty as EmptyConfig).description}
        action={(empty as EmptyConfig).action}
      />
    )
  }

  return <>{children}</>
}