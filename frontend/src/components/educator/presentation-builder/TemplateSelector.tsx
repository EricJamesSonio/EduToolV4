"use client";

import { cn } from "@/lib/utils";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";

const TEMPLATES = Object.entries(TEMPLATE_STYLES).map(([id, ts]) => ({ id, label: ts.label }));

interface TemplateSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

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