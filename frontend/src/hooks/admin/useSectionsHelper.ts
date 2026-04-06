// frontend/src/hooks/admin/useSectionsHelper.ts
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { AxiosError } from "axios";

export function useSections(schoolYearId: string | null) {
  const queryClient = useQueryClient();
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [deleteTarget, setDeleteTarget]   = useState<Section | null>(null);

  const { data: allSections = [], isLoading } = useQuery({
    queryKey: ["admin", "sections", schoolYearId],
    queryFn: () => sectionApi.getAll(schoolYearId!),    // backend filters by org; we filter by level client-side
    enabled:  !!schoolYearId,
  });

  // client-side level filter
  const sections = filterLevelId === "all"
    ? allSections
    : allSections.filter((s) => s.level_id === filterLevelId);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionApi.delete(id),
    onSuccess: () => {
      toast.success("Section deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections", schoolYearId] });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete section.");
      setDeleteTarget(null);
    },
  });

  return {
    sections,
    isLoading,
    filterLevelId,
    setFilterLevelId,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  };
}