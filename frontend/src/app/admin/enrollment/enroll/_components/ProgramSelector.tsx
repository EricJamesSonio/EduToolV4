"use client";

import { GraduationCap, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS,
} from "@/types/admin/program.types";
import { cn } from "@/lib/utils";

import type { Program } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";

interface ProgramSelectorProps {
  programs: Program[];
  isLoading: boolean;
  onSelect: (programId: string) => void;
}

export function ProgramSelector({ programs, isLoading, onSelect }: ProgramSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {programs.map((p) => {
        const typeLabel = PROGRAM_TYPE_LABELS[p.type as keyof typeof PROGRAM_TYPE_LABELS] ?? p.type;
        const typeColor = PROGRAM_TYPE_COLORS[p.type as keyof typeof PROGRAM_TYPE_COLORS] ?? "";
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className="rounded-xl border bg-card p-6 space-y-4 text-left transition-all hover:bg-muted/30"
          >
            <div className="flex items-start gap-3">
              <div className="icon-container icon-edu shrink-0 mt-0.5">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-lg leading-tight">{p.name}</p>
                <Badge variant="outline" className={cn("text-xs border", typeColor)}>
                  {typeLabel}
                </Badge>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface CourseStrandSelectorProps {
  items: { id: string; name: string; code?: string | null }[];
  isCollege: boolean;
  onSelect: (id: string) => void;
}

export function CourseStrandSelector({ items, isCollege, onSelect }: CourseStrandSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className="rounded-xl border bg-card p-6 space-y-4 text-left transition-all hover:bg-muted/30"
        >
          <div className="flex items-start gap-3">
            <div className="icon-container icon-edu shrink-0 mt-0.5">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-lg leading-tight">{item.code ?? item.name}</p>
              {item.code && <p className="text-sm text-muted-foreground">{item.name}</p>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

interface LevelSelectorProps {
  levels: Level[];
  isLoading: boolean;
  onSelect: (levelId: string) => void;
}

export function LevelSelector({ levels, isLoading, onSelect }: LevelSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-6 py-12 text-center">
        <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No levels available for this program.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {levels.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onSelect(l.id)}
          className="rounded-xl border bg-card p-6 space-y-4 text-left transition-all hover:bg-muted/30"
        >
          <div className="flex items-start gap-3">
            <div className="icon-container icon-edu shrink-0 mt-0.5">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-lg leading-tight">{l.name}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
