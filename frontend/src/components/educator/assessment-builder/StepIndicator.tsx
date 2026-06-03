import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CIRCLE_COLORS } from "./constants";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const c = CIRCLE_COLORS[i % CIRCLE_COLORS.length];
        return (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-[3px] transition-colors",
                  done && c.fill,
                  active && c.outline,
                  !done &&
                    !active &&
                    "border-muted-foreground/30 text-muted-foreground/40 bg-card"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  active
                    ? "text-primary font-medium"
                    : "text-muted-foreground/50"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 mx-1 mb-6 shrink-0",
                  i < current ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
