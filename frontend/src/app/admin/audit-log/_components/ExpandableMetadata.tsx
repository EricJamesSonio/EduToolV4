"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ExpandableMetadata({
  metadata,
}: {
  metadata: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const preview = Object.entries(metadata)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");

  return (
    <div className="space-y-1">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? "Hide details" : preview}
      </button>
      {expanded && (
        <pre className="rounded bg-muted px-2 py-1.5 text-xs leading-relaxed whitespace-pre-wrap break-all max-w-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}
