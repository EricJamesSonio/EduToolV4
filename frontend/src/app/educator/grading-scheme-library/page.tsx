"use client";

import { useState } from "react";
import { Plus, Library } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { GradingSchemeTemplateCard } from "@/components/educator/grading-scheme/GradingSchemeTemplateCard";
import { TemplateFormDialog } from "@/components/educator/grading-scheme/TemplateFormDialog";
import { ApplyToClassDialog } from "@/components/educator/grading-scheme/ApplyToClassDialog";

import {
  useEducatorTemplateLibrary,
  useDeleteTemplate,
} from "@/hooks/educator/useGradingSchemeTemplates";

import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";

export default function GradingSchemeLibraryPage() {
  const { data: library, isLoading } = useEducatorTemplateLibrary();

  const deleteMutation = useDeleteTemplate();

  const [showNew, setShowNew] = useState(false);
  const [editTemplate, setEditTemplate] = useState<GradingSchemeTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<GradingSchemeTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<GradingSchemeTemplate | null>(null);

  const handleEdit = (scheme: GradingSchemeTemplate) => {
    setEditTemplate(scheme);
    setShowNew(true);
  };

  const handleNewOpenChange = (open: boolean) => {
    setShowNew(open);
    if (!open) setEditTemplate(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTemplate) return;

    deleteMutation.mutate(deleteTemplate.id, {
      onSuccess: () => {
        toast.success("Template deleted.");
        setDeleteTemplate(null);
      },
      onError: () => {
        toast.error("Failed to delete template.");
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Scheme Library"
        description="Create and manage reusable grading scheme templates."
        actions={
          <Button onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-full animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : !library || library.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No Templates Available"
          description="Create a grading scheme template to start building reusable schemes."
        />
      ) : (
        <div className="space-y-2">
          {library.map((scheme) => (
            <GradingSchemeTemplateCard
              key={scheme.id}
              scheme={scheme}
              onEdit={handleEdit}
              onDelete={setDeleteTemplate}
              onApplyToClass={(templateId) => {
                const found = library.find((s) => s.id === templateId);
                if (found) setApplyTemplate(found);
              }}
            />
          ))}
        </div>
      )}

      <TemplateFormDialog
        open={showNew}
        onOpenChange={handleNewOpenChange}
        editTemplate={editTemplate}
      />

      <ApplyToClassDialog
        open={!!applyTemplate}
        onOpenChange={(o) => {
          if (!o) setApplyTemplate(null);
        }}
        scheme={applyTemplate}
      />

      <ConfirmDialog
        open={!!deleteTemplate}
        onOpenChange={(o) => {
          if (!o) setDeleteTemplate(null);
        }}
        title="Delete template?"
        message={
          deleteTemplate
            ? `Delete "${deleteTemplate.name}"? This cannot be undone.`
            : "Delete this template?"
        }
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
