"use client";

import { useRouter } from "next/navigation";
import { Eye, Trash2, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROGRAM_TYPE_LABELS } from "./constants";
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

  // Use `as const` cast ensures TS knows this is a valid ProgramType key
  const label = PROGRAM_TYPE_LABELS[program.type as keyof typeof PROGRAM_TYPE_LABELS];

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
          <GraduationCap className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-sm leading-tight">{program.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant={isCustom ? "outline" : "secondary"} className="text-xs">
              {label}
            </Badge>
            {courseCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {courseCount} {courseCount === 1 ? "course" : "courses"}
              </span>
            )}
            {strandCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {strandCount} {strandCount === 1 ? "strand" : "strands"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/programs/${program.id}`)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
        {isCustom && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => onDelete(program)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}