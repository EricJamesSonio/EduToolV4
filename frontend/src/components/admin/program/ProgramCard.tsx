"use client";

import { useRouter } from "next/navigation";
import { Eye, Trash2, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ListItemCardAction,
  listItemCardClass,
  listItemIconClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { cn, pickCardColor } from "@/lib/utils";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import type { Program } from "@/types/admin/program.types";

interface ProgramCardProps {
  program: Program;
  onDelete: (program: Program) => void;
}

export function ProgramCard({ program, onDelete }: ProgramCardProps): React.JSX.Element {
  const router = useRouter();
  const isCustom = program.type === "custom";
  const courseCount = program.courses?.length ?? 0;
  const strandCount = program.strands?.length ?? 0;

  const label = PROGRAM_TYPE_LABELS[program.type as keyof typeof PROGRAM_TYPE_LABELS];
  const color = PROGRAM_TYPE_COLORS[program.type as keyof typeof PROGRAM_TYPE_COLORS]
    ?? "badge-muted";

  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <div className={cn(listItemIconClass, pickCardColor(program.id), "mt-0.5")}>
          <GraduationCap className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className={cn(listItemTitleClass, "not-interactive")}>{program.name}</h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs border px-2 py-0.5", color)}
            >
              {label}
            </Badge>
            {courseCount > 0 && (
              <span className="text-xs text-muted-foreground not-interactive">
                {courseCount} {courseCount === 1 ? "course" : "courses"}
              </span>
            )}
            {strandCount > 0 && (
              <span className="text-xs text-muted-foreground not-interactive">
                {strandCount} {strandCount === 1 ? "strand" : "strands"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ListItemCardAction
          icon={Eye}
          label="View"
          onClick={() => router.push(`/admin/programs/${program.id}`)}
        />
        {isCustom && (
          <ListItemCardAction
            icon={Trash2}
            label="Delete"
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => onDelete(program)}
          />
        )}
      </div>
    </div>
  );
}