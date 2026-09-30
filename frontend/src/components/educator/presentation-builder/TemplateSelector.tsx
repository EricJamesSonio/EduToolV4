"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TEMPLATES = Object.entries(TEMPLATE_STYLES).map(([id, ts]) => ({ id, label: ts.label }));

interface TemplateSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

/** The grid itself — kept exported unchanged in case it's used elsewhere. */
export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {TEMPLATES.map((t) => {
        const tStyle = TEMPLATE_STYLES[t.id];
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative rounded-lg border-2 overflow-hidden text-left transition-all",
              value === t.id
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-muted-foreground/30",
            )}
          >
            <div className="h-10 bg-cover bg-center" style={{ backgroundImage: `url(${tStyle.image})` }} />
            <div className="px-1.5 py-1">
              <p className="text-[10px] font-medium leading-tight truncate">{t.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact dropdown trigger for the unified toolbar — shows the current
 * template's thumbnail + name, and opens the same grid in a popover.
 */
export function TemplateDropdown({ value, onChange }: TemplateSelectorProps) {
  const current = TEMPLATE_STYLES[value] ?? TEMPLATE_STYLES.green;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 justify-between gap-2 min-w-[9.5rem]">
          <span className="flex items-center gap-1.5 truncate">
            <span
              className="h-4 w-4 rounded-sm bg-cover bg-center shrink-0 border"
              style={{ backgroundImage: `url(${current.image})` }}
            />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <TemplateSelector value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}