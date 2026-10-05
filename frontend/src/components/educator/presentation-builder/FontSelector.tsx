"use client";

import { Check, PaintBucket, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FONT_FAMILIES, type FontFamily } from "./types";

interface FontSelectorProps {
  value: FontFamily;
  hasSlides: boolean;
  onChange: (font: FontFamily) => void;
  onApplyAll: (font: FontFamily) => void;
}

/**
 * Compact dropdown for the unified toolbar. Clicking a font sets it as the
 * default for new slides; the "All" button next to it applies that font to
 * every existing slide (mirrors the old inline toolbar's two-button pattern).
 */
export function FontSelector({ value, hasSlides, onChange, onApplyAll }: FontSelectorProps) {
  const active = FONT_FAMILIES.find((f) => f.value === value) ?? FONT_FAMILIES[0];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 justify-between gap-2 min-w-[9.5rem]">
            <span className="flex items-center gap-1.5 truncate">
              <PaintBucket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span style={{ fontFamily: active.stack }} className="truncate">
                {active.label}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-72 p-2">
        <p className="px-1 pb-1.5 text-[11px] text-muted-foreground">
          {hasSlides
            ? 'Click a font to set default · "All" applies it to existing slides'
            : "Sets the default font for new slides"}
        </p>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {FONT_FAMILIES.map((ff) => {
            const isActive = value === ff.value;
            return (
              <div key={ff.value} className="flex items-center gap-1">
                <button
                  onClick={() => onChange(ff.value)}
                  style={{ fontFamily: ff.stack }}
                  className={cn(
                    "flex-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-left transition-colors",
                    isActive
                      ? "bg-[#BFDBFE] text-[#0B1E3A] font-semibold"
                      : "hover:bg-muted/60",
                  )}
                >
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                  {ff.label}
                </button>
                {hasSlides && (
                  <button
                    onClick={() => onApplyAll(ff.value)}
                    title={`Apply "${ff.label}" to all existing slides`}
                    className="shrink-0 rounded-md border px-2 py-1.5 text-[10px] text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
                  >
                    All
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}