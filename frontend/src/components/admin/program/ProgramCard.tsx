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

const ACTION_BTN =
  "border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors";

const ICON_BOX =
  "flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white shrink-0 mt-0.5";

export function ProgramCard({
  program,
  onDelete,
}: ProgramCardProps): React.JSX.Element {
  const router = useRouter();

  const isCustom = program.type === "custom";
  const courseCount = program.courses?.length ?? 0;
  const strandCount = program.strands?.length ?? 0;

  const label =
    PROGRAM_TYPE_LABELS[program.type as keyof typeof PROGRAM_TYPE_LABELS];

  return (
    <div className="border-[3px] border-black bg-white p-5 space-y-4">
      {/* HEADER */}
      <div className="flex items-start gap-3">
        <div className={ICON_BOX}>
          <GraduationCap className="h-4.5 w-4.5 text-black" />
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-sm uppercase tracking-wide">
            {program.name}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="border-[2px] border-black bg-white text-black text-xs">
              {label}
            </Badge>

            {courseCount > 0 && (
              <span className="text-xs text-black/70">
                {courseCount} {courseCount === 1 ? "course" : "courses"}
              </span>
            )}

            {strandCount > 0 && (
              <span className="text-xs text-black/70">
                {strandCount} {strandCount === 1 ? "strand" : "strands"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className={ACTION_BTN}
          onClick={() => router.push(`/admin/programs/${program.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>

        {isCustom && (
          <Button
            size="sm"
            className={ACTION_BTN}
            onClick={() => onDelete(program)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}