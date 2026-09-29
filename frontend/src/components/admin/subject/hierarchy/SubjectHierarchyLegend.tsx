"use client";

import { Check } from "lucide-react";
import { YEAR_COLORS } from "@/lib/palette";

interface Props {
  ranks: number[];
  levelNameOf?: (rank: number) => string;
}

/** Year = color legend — cleaner than per-node "4th Year" text. */
export function SubjectHierarchyLegend({ ranks, levelNameOf }: Props): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      {ranks.map((rank) => {
        const color = YEAR_COLORS[(rank - 1) % YEAR_COLORS.length];
        return (
          <span key={rank} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{ backgroundColor: color.swatch, borderColor: color.swatch }}
            />
            {levelNameOf ? levelNameOf(rank) : `Year ${rank}`}
          </span>
        );
      })}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" />
        </span>
        Completed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Enrolled now
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-5 bg-foreground/60" />
        Prerequisite
      </span>
    </div>
  );
}
