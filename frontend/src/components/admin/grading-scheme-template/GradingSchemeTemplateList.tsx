// src/components/admin/grading-scheme-template/GradingSchemeTemplateList.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDeleteGradingSchemeTemplate } from "@/hooks/admin/useGradingSchemeTemplates";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { AxiosError } from "axios";

interface GradingSchemeTemplateListProps {
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
  onCreateClick: () => void;
  onEditClick: (template: GradingSchemeTemplate) => void;
}

export function GradingSchemeTemplateList({
  templates,
  isLoading,
  onCreateClick,
  onEditClick,
}: GradingSchemeTemplateListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GradingSchemeTemplate | null>(null);
  const deleteMutation = useDeleteGradingSchemeTemplate();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Template deleted.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        const err = e as AxiosError<{ message: string }>;
        toast.error(err?.response?.data?.message ?? "Failed to delete.");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">No templates yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first grading scheme template</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={onCreateClick}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Template
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() =>
                setExpanded(expanded === template.id ? null : template.id)
              }
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                  expanded === template.id && "rotate-90"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{template.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {template.components?.length ?? 0} component{(template.components?.length ?? 0) !== 1 ? "s" : ""}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(template);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(template);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded === template.id && (
              <div className="border-t px-4 py-3 bg-muted/20 space-y-2">
                {template.components?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No components</p>
                ) : (
                  template.components?.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{comp.name}</span>
                      <span className="font-medium">{comp.weight}%</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <Dialog open onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete template?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Delete <strong>"{deleteTarget.name}"</strong>? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}