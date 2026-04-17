"use client";

import { useState, useMemo } from "react";
import { Plus, Library } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { GradingSchemeTemplateCard } from "@/components/educator/grading-scheme/GradingSchemeTemplateCard";
import { NewTemplateDialog } from "@/components/educator/grading-scheme/NewTemplateDialog";
import { ApplyToClassDialog } from "@/components/educator/grading-scheme/ApplyToClassDialog";

import { useQueryClient } from "@tanstack/react-query";

import type { GradingScheme } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

export default function GradingSchemeLibraryPage() {
  const queryClient = useQueryClient();

  /**
   * IMPORTANT:
   * Backend DOES NOT provide a library endpoint yet.
   * So we only use cached/react-created templates if they exist.
   */
  const cached = queryClient.getQueryData<GradingScheme[]>([
    "grading-scheme",
    "educator-library",
  ]);

  const library = useMemo(() => cached ?? [], [cached]);

  const [showNew, setShowNew] = useState(false);
  const [editScheme, setEditScheme] = useState<GradingScheme | null>(null);
  const [deleteScheme, setDeleteScheme] = useState<GradingScheme | null>(null);
  const [applyScheme, setApplyScheme] = useState<GradingScheme | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (scheme: GradingScheme) => {
    setEditScheme(scheme);
    setShowNew(true);
  };

  const handleNewOpenChange = (open: boolean) => {
    setShowNew(open);
    if (!open) setEditScheme(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteScheme) return;

    setIsDeleting(true);

    try {
      /**
       * BACKEND DOES NOT HAVE DELETE ENDPOINT YET
       * So we only do local cache removal.
       */
      toast.info("Delete not supported yet in backend.");

      queryClient.setQueryData<GradingScheme[]>(
        ["grading-scheme", "educator-library"],
        (prev) => (prev ?? []).filter((s) => s.id !== deleteScheme.id)
      );

      setDeleteScheme(null);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast.error(
        axiosErr?.response?.data?.message ??
          "Failed to delete template."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Scheme Library"
        description="Templates are created from class schemes and stored in cache until backend exposes a template endpoint."
        actions={
          <Button onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      {/* EMPTY STATE WHEN NO CACHED DATA */}
      {library.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No Templates Available"
          description="Create a grading scheme from a class to start building reusable templates."
        />
      ) : (
        <div className="space-y-2">
          {library.map((scheme) => (
            <GradingSchemeTemplateCard
              key={scheme.id}
              scheme={scheme}
              onEdit={handleEdit}
              onDelete={setDeleteScheme}
              onApplyToClass={setApplyScheme}
            />
          ))}
        </div>
      )}

      {/* NEW / EDIT TEMPLATE */}
      <NewTemplateDialog
        open={showNew}
        onOpenChange={handleNewOpenChange}
        editScheme={editScheme}
      />

      {/* APPLY TO CLASS */}
      <ApplyToClassDialog
        open={!!applyScheme}
        onOpenChange={(o) => {
          if (!o) setApplyScheme(null);
        }}
        scheme={applyScheme}
      />

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={!!deleteScheme}
        onOpenChange={(o) => {
          if (!o) setDeleteScheme(null);
        }}
        title="Delete template?"
        message={
          deleteScheme
            ? `Delete "${deleteScheme.name}"? This is a local-only action for now.`
            : "Delete this template?"
        }
        confirmLabel="Delete"
        destructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}