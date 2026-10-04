"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getMetadataEntries } from "./utils";

export function ExpandableMetadata({
  metadata,
}: {
  metadata: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const entries = getMetadataEntries(metadata);

  if (entries.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const preview = entries
    .slice(0, 2)
    .map((e) => `${e.label}: ${e.value}`)
    .join(" · ");

  // Nothing more to reveal when the preview already shows everything.
  if (entries.length <= 2) {
    return <span className="text-xs text-muted-foreground">{preview}</span>;
  }

  return (
    <div className="space-y-1">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
        className="flex items-center gap-1 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        {expanded ? "Hide details" : `${preview} · +${entries.length - 2} more`}
      </button>
      {expanded && (
        <dl className="max-w-sm space-y-0.5 rounded bg-muted px-2.5 py-2 text-xs">
          {entries.map((e) => (
            <div key={e.label} className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">{e.label}:</dt>
              <dd className="break-words">{e.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}