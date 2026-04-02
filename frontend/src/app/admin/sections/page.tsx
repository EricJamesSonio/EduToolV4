"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { sectionApi } from "@/api/admin/section.api";
import { levelApi } from "@/api/admin/level.api";
import type { Section } from "@/types/admin/section.types";
import type { Level } from "@/types/admin/level.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import type { AxiosError } from "axios";

interface SectionFormValues {
  levelId: string;
  name: string;
  capacity: number;
}

function SectionDialog({
  section,
  levels,
  open,
  onClose,
  onSaved,
}: {
  section?: Section;
  levels: Level[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}): React.JSX.Element {
  const isEdit = !!section;
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SectionFormValues>({
    defaultValues: {
      levelId: section?.levelId ?? "",
      name: section?.name ?? "",
      capacity: section?.capacity ?? 30,
    },
  });

  const selectedLevelId = watch("levelId");

  const mutation = useMutation({
    mutationFn: (values: SectionFormValues) =>
      isEdit
        ? sectionApi.update(section!.id, {
            name: values.name,
            capacity: values.capacity,
          })
        : sectionApi.create({
            levelId: values.levelId,
            name: values.name,
            capacity: values.capacity,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Section updated." : "Section created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save section.");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Section" : "New Section"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={(v) => setValue("levelId", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedLevelId && (
                <p className="text-xs text-muted-foreground">
                  Select a level for this section.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Section Name</Label>
            <Input
              placeholder="e.g. Section A, Rizal, Mabini"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 1, message: "At least 1 character" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 40"
              {...register("capacity", {
                required: "Capacity is required",
                min: { value: 1, message: "At least 1 student" },
                valueAsNumber: true,
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">
                {errors.capacity.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (!isEdit && !selectedLevelId)}
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SectionsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn: () => levelApi.getAll(),
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["admin", "sections", filterLevelId],
    queryFn: () =>
      sectionApi.getAll(filterLevelId !== "all" ? filterLevelId : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionApi.delete(id),
    onSuccess: () => {
      toast.success("Section deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete section.");
      setDeleteTarget(null);
    },
  });

  const levelMap = useMemo(
    () => Object.fromEntries(levels.map((l) => [l.id, l.name])),
    [levels]
  );

  const isLoading = levelsLoading || sectionsLoading;

  const columns: ColumnDef<Section>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      header: "Level",
      accessorFn: (row) => levelMap[row.levelId] ?? "—",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="font-normal">
          {getValue<string>()}
        </Badge>
      ),
    },
    {
      header: "Capacity",
      accessorKey: "capacity",
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<number>()}</span>
      ),
    },
    {
      header: "Students",
      id: "students",
      cell: ({ row }) => {
        const s = row.original;
        const count = s.studentCount ?? 0;
        const pct = Math.min((count / s.capacity) * 100, 100);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums">
              {count} / {s.capacity}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setEditTarget(s)}
              title="Edit section"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(s)}
              title="Delete section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Section
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Select
          value={filterLevelId}
          onValueChange={(v) => setFilterLevelId(v ?? "all")}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No sections found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filterLevelId !== "all"
              ? "No sections for this level yet."
              : "Create your first section to get started."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Section
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={sections} />
      )}

      {createOpen && (
        <SectionDialog
          levels={levels}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "sections"] })
          }
        />
      )}

      {editTarget && (
        <SectionDialog
          section={editTarget}
          levels={levels}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "sections"] })
          }
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this section?"
          message={`Delete "${deleteTarget.name}"? Students enrolled in this section may be affected.`}
          confirmLabel="Delete Section"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}