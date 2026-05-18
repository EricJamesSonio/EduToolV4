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
          <span className="truncate text-sm font-medium text-foreground">
            {template.name}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted-foreground">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...template.semesters]
              .sort((a, b) => a.order_index - b.order_index)
              .map((sem) => (
                <div
                  key={sem.id ?? sem.order_index}
                  className="rounded-lg border bg-background p-4"
                >
                  <p className="mb-3 text-sm font-medium text-foreground">
                    {sem.name}
                  </p>

                  {sem.terms.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      No terms
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {[...sem.terms]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((term) => (
                          <div
                            key={term.id ?? term.order_index}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                            {term.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}