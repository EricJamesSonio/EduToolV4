import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
    <div className="border-2 border-primary bg-card transition-colors hover:shadow-md hover:border-accent">
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <ChevronRight
          className={cn(
            "h-5 w-5 text-primary transition-transform shrink-0",
            expanded && "rotate-90"
          )}
        />
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-base font-semibold truncate">{template.name}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm font-medium text-muted-foreground">
            {template.semesters.length} sem
            {template.semesters.length !== 1 ? "s" : ""}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent hover:text-accent-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {expanded && (
        <div className="border-t-2 border-border px-6 py-4 bg-secondary">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...template.semesters]
              .sort((a, b) => a.order_index - b.order_index)
              .map((sem) => (
                <div
                  key={sem.id ?? sem.order_index}
                  className="border-2 border-border bg-card p-4"
                >
                  <p className="text-sm font-bold text-foreground mb-3">
                    {sem.name}
                  </p>
                  {sem.terms.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
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
                            <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
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