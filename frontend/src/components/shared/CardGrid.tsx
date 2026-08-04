import * as React from "react";
import { cn, cardGridClass, cardListGridClass } from "@/lib/utils";

interface CardGridProps extends React.ComponentProps<"div"> {
  /**
   * When provided, the grid sizes itself to the number of items:
   * 1 → full width, 2–3 → 2-up (3-up on lg), 4+ → 2/3/4-up.
   * When omitted, the generic list recipe (2-up → 3-up on lg) is used.
   */
  count?: number;
}

/**
 * Responsive card-list grid. Two-up on mobile (wide enough for titles and
 * metadata), scaling up at lg/xl. Override via `className` (e.g. add
 * `xl:grid-cols-4`) when a list needs denser desktop layout.
 */
export function CardGrid({ className, count, ...props }: CardGridProps): React.JSX.Element {
  return (
    <div
      className={cn("grid", count != null ? cardGridClass(count) : cardListGridClass(), className)}
      {...props}
    />
  );
}
