"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Pause, Play } from "lucide-react";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useConcernCategories,
  useCreateConcernCategory,
  useUpdateConcernCategory,
} from "@/hooks/admin/useConcernCategories";
import type { ConcernCategoryItem } from "@/api/admin/concern.api";

function toErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message: string }>;
  return axiosErr?.response?.data?.message ?? "Something went wrong.";
}

interface CategoryManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryManagerDialog({
  open,
  onClose,
}: CategoryManagerDialogProps): React.JSX.Element {
  const { data: categories = [], isPending: loading } = useConcernCategories();
  const createMutation = useCreateConcernCategory();
  const updateMutation = useUpdateConcernCategory();

  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const startEdit = (category: ConcernCategoryItem) => {
    setEditingId(category.id);
    setEditLabel(category.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    try {
      await createMutation.mutateAsync({ label });
      toast.success("Category added");
      setNewLabel("");
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const label = editLabel.trim();
    if (!label) return;
    try {
      await updateMutation.mutateAsync({ categoryId: editingId, data: { label } });
      toast.success("Category renamed");
      cancelEdit();
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  const handleToggleActive = async (category: ConcernCategoryItem) => {
    try {
      await updateMutation.mutateAsync({
        categoryId: category.id,
        data: { is_active: !category.is_active },
      });
      toast.success(category.is_active ? "Category deactivated" : "Category activated");
    } catch (err) {
      toast.error(toErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Concern Categories</DialogTitle>
          <DialogDescription>
            Manage the categories students pick when submitting a concern.
            Deactivating one hides it from the submit form without affecting
            existing concerns. There is no delete — deactivate only.
          </DialogDescription>
        </DialogHeader>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-category">New Category</Label>
            <Input
              id="new-category"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Billing Issue"
              required
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </form>

        {/* Category list */}
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              title="No categories"
              description="Add your first category to get started."
            />
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 rounded-lg border bg-card p-2.5"
              >
                {editingId === category.id ? (
                  <form onSubmit={handleSaveEdit} className="flex flex-1 items-center gap-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      autoFocus
                      required
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 min-w-0 truncate text-sm font-medium">
                      {category.label}
                    </span>
                    {category.is_default && (
                      <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
                        Default
                      </Badge>
                    )}
                    {!category.is_active && (
                      <Badge variant="outline" className="shrink-0 font-normal bg-muted text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Rename category"
                      onClick={() => startEdit(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={category.is_active ? "Deactivate category" : "Activate category"}
                      onClick={() => handleToggleActive(category)}
                      disabled={updateMutation.isPending && editingId === null}
                    >
                      {category.is_active ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}