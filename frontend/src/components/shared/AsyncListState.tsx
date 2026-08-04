"use client";

import type { ReactNode } from "react";
import { isValidElement } from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
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
  /** Custom loading fallback. Defaults to a card skeleton grid. */
  loading?: ReactNode;
  /** Empty-state config, or a custom React node to render when empty. */
  empty: EmptyConfig | ReactNode;
  /** The content to render when there is data. */
  children: ReactNode;
}

/**
 * Single, consistent source of truth for rendering async list states:
 * loading → empty → content.
 *
 * Errors render exactly like the empty state (with its action button). Showing
 * "failed to load" only confuses users into thinking their data exists but
 * just won't render, so a failed fetch looks the same as "nothing is there yet".
 */
export function AsyncListState({
  isLoading,
  isError,
  isEmpty,
  loading,
  empty,
  children,
}: AsyncListStateProps) {
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

  if (isEmpty || isError) {
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