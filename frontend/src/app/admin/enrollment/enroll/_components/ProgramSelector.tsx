"use client";

import { GraduationCap, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listItemCardClass,
  listItemIconClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import {
  PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS,
} from "@/types/admin/program.types";
import { cn } from "@/lib/utils";
import { CardGrid } from "@/components/shared/CardGrid";

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
      <CardGrid className="xl:grid-cols-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </CardGrid>
    );
  }

  return (
    <CardGrid className="xl:grid-cols-3">
      {programs.map((p) => {
        const typeLabel = PROGRAM_TYPE_LABELS[p.type as keyof typeof PROGRAM_TYPE_LABELS] ?? p.type;
        const typeColor = PROGRAM_TYPE_COLORS[p.type as keyof typeof PROGRAM_TYPE_COLORS] ?? "";
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(listItemCardClass, "text-left transition-all hover:bg-muted/30")}
          >
            <div className="flex items-start gap-3">
              <div className={cn(listItemIconClass, "icon-edu mt-0.5")}>
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className={cn(listItemTitleClass, "not-interactive")}>{p.name}</p>
                <Badge variant="outline" className={cn("text-xs border", typeColor)}>
                  {typeLabel}
                </Badge>
              </div>
            </div>
          </button>
        );
      })}
    </CardGrid>
  );
}

interface CourseStrandSelectorProps {
  items: { id: string; name: string; code?: string | null }[];
  isCollege: boolean;
  onSelect: (id: string) => void;
}

export function CourseStrandSelector({ items, isCollege, onSelect }: CourseStrandSelectorProps) {
  return (
    <CardGrid className="xl:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(listItemCardClass, "text-left transition-all hover:bg-muted/30")}
        >
          <div className="flex items-start gap-3">
            <div className={cn(listItemIconClass, "icon-edu mt-0.5")}>
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className={cn(listItemTitleClass, "not-interactive")}>{item.code ?? item.name}</p>
              {item.code && <p className="text-sm text-muted-foreground">{item.name}</p>}
            </div>
          </div>
        </button>
      ))}
    </CardGrid>
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
      <CardGrid className="xl:grid-cols-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </CardGrid>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-6 py-12 text-center">
        <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No levels available for this department.</p>
      </div>
    );
  }

  return (
    <CardGrid className="xl:grid-cols-3">
      {levels.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onSelect(l.id)}
          className={cn(listItemCardClass, "text-left transition-all hover:bg-muted/30")}
        >
          <div className="flex items-start gap-3">
            <div className={cn(listItemIconClass, "icon-edu mt-0.5")}>
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className={cn(listItemTitleClass, "not-interactive")}>{l.name}</p>
            </div>
          </div>
        </button>
      ))}
    </CardGrid>
  );
}
