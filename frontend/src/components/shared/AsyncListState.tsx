"use client";

import type { ReactNode } from "react";
import { isValidElement } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EmptyConfig {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface AsyncListStateProps {
  /** True only while there is no data yet and a fetch is in-flight (v5 semantics). */
  isLoading: boolean;
  /** True when the fetch settled with an error. */
  isError: boolean;
  /** True when the fetch confirmed there is nothing to show. */
  isEmpty: boolean;
  /** Optional handler re-run on the failed fetch (shown as a Retry button on error). */
  onRetry?: () => void;
  /** Custom loading fallback. Defaults to a card skeleton grid. */
  loading?: ReactNode;
  /** Empty-state config, or a custom React node to render when empty. */
  empty: EmptyConfig | ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  /** The content to render when there is data. */
  children: ReactNode;
}

/**
 * Single, consistent source of truth for rendering async list states:
 * error (with Retry) → loading → empty → content.
 *
 * Every admin list page should route its list-body through this so the UX is
 * uniform: a failed fetch shows an actionable error instantly, a confirmed
 * empty dataset shows the empty state immediately, and loading only appears
 * while there is genuinely nothing cached yet.
 */
export function AsyncListState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  loading,
  empty,
  errorTitle = "Failed to load data",
  errorDescription,
  children,
}: AsyncListStateProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{errorTitle}</p>
          {errorDescription && (
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              {errorDescription}
            </p>
          )}
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      loading ?? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      )
    );
  }

  if (isEmpty) {
    if (isValidElement(empty)) return empty;
    return (
      <EmptyState
        icon={(empty as EmptyConfig).icon}
        title={(empty as EmptyConfig).title}
        description={(empty as EmptyConfig).description}
        action={(empty as EmptyConfig).action}
      />
    );
  }

  return <>{children}</>;
}