"use client";

import { ChevronRight } from "lucide-react";
import { SUMMARY_ROWS } from "./constants";

interface Props {
  byType: Record<string, number> | undefined;
  onNavigate: (href: string) => void;
}

export function NotificationSummaryRows({
  byType,
  onNavigate,
}: Props): React.JSX.Element | null {
  const rows = SUMMARY_ROWS.filter((r) => (byType?.[r.type] ?? 0) > 0);
  if (rows.length === 0) return null;

  return (
    <div className="shrink-0 border-b bg-muted/30 p-2">
      <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Needs attention
      </p>
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <button
            key={row.type}
            type="button"
            onClick={() => onNavigate(row.href)}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 font-medium">
              {row.label(byType?.[row.type] ?? 0)}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}