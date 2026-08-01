import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { SemesterTemplate } from "@/types/admin/semester-template.types";

interface TemplateCardProps {
  template: SemesterTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
}: TemplateCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border bg-card transition-all hover:bg-muted/20">
      <div
        className="flex cursor-pointer select-none items-center gap-4 px-5 py-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
        />

        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-medium text-foreground not-interactive">
            {template.name}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted-foreground not-interactive">
            {template.semesters.length} sem
            {template.semesters.length !== 1 ? "s" : ""}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-5 py-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {[...template.semesters]
              .sort((a, b) => a.order_index - b.order_index)
              .map((sem, si) => {
                const cardBg = ["bg-blue-50/50", "bg-emerald-50/50", "bg-purple-50/50", "bg-amber-50/50", "bg-teal-50/50", "bg-indigo-50/50", "bg-pink-50/50", "bg-cyan-50/50", "bg-orange-50/50", "bg-rose-50/50"];
                const textClr = ["text-blue-600", "text-emerald-600", "text-purple-600", "text-amber-600", "text-teal-600", "text-indigo-600", "text-pink-600", "text-cyan-600", "text-orange-600", "text-rose-600"];
                const dotClr  = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-rose-500"];
                const siMod = si % 10;
                return (
                  <div
                    key={sem.id ?? sem.order_index}
                    className={cn("rounded-lg border", cardBg[siMod], "p-3 sm:p-4")}
                  >
                    <p className={cn("mb-3 text-sm font-medium not-interactive", textClr[siMod])}>
                      {sem.name}
                    </p>

                    {sem.terms.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground not-interactive">
                        No terms
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {[...sem.terms]
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((term, ti) => (
                            <div
                              key={term.id ?? term.order_index}
                              className="flex items-center gap-2 text-xs text-muted-foreground not-interactive"
                            >
                              <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClr[(siMod * 10 + ti) % 10])} />
                              {term.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}