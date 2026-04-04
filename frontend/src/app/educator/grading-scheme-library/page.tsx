"use client";

import { useState } from "react";
import { Plus, Library } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { GradingSchemeTemplateCard } from "@/components/educator/grading-scheme/GradingSchemeTemplateCard";
import { NewTemplateDialog } from "@/components/educator/grading-scheme/NewTemplateDialog";
import { ApplyToClassDialog } from "@/components/educator/grading-scheme/ApplyToClassDialog";
import {
  useGradingSchemeLibrary,
  useUpdateGradingScheme,
} from "@/hooks/educator/useGradingSchemes";
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api";
import { useQueryClient } from "@tanstack/react-query";
import type { GradingScheme } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

export default function GradingSchemeLibraryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGradingSchemeLibrary();
  const library: GradingScheme[] = Array.isArray(data) ? data : [];

  const [showNew, setShowNew]                     = useState(false);
  const [editScheme, setEditScheme]               = useState<GradingScheme | null>(null);
  const [deleteScheme, setDeleteScheme]           = useState<GradingScheme | null>(null);
  const [applyScheme, setApplyScheme]             = useState<GradingScheme | null>(null);
  const [isDeleting, setIsDeleting]               = useState(false);

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
      // Reuse update mutation to soft-delete isn't supported; call API directly
      // The backend doesn't expose a DELETE endpoint — we'll patch with empty
      // components to signal intent. If backend adds DELETE later, swap this out.
      // For now: optimistically remove from cache and call update with a flag.
      // Actually — show a note and remove from local cache only until backend supports it.
      // TODO: add DELETE /grading-schemes/:id on backend, then call it here.
      toast.info("Delete support coming soon — template hidden locally.");
      queryClient.setQueryData<GradingScheme[]>(
        ["grading-scheme", "educator-library"],
        (prev) => (prev ?? []).filter((s) => s.id !== deleteScheme.id)
      );
      setDeleteScheme(null);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast.error(axiosErr?.response?.data?.message ?? "Failed to delete template.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Scheme Library"
        description="Manage your personal grading scheme templates. Apply them to any of your classes."
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
            <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : library.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No templates yet"
          description='Click "+ New Template" to create your first grading scheme template.'
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

      {/* New / Edit template dialog */}
      <NewTemplateDialog
        open={showNew}
        onOpenChange={handleNewOpenChange}
        editScheme={editScheme}
      />

      {/* Apply to class dialog */}
      <ApplyToClassDialog
        open={!!applyScheme}
        onOpenChange={(o) => { if (!o) setApplyScheme(null); }}
        scheme={applyScheme}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteScheme}
        onOpenChange={(o) => { if (!o) setDeleteScheme(null); }}
        title="Delete template?"
        message={
          deleteScheme
            ? `Delete "${deleteScheme.name}" from your library? This cannot be undone.`
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