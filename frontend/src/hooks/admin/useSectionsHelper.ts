// filepath: app/admin/sections/_hooks/useSections.ts

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { AxiosError } from "axios";

interface UseSectionsReturn {
  sections: Section[];
  isLoading: boolean;
  filterLevelId: string;
  setFilterLevelId: (id: string) => void;
  deleteTarget: Section | null;
  setDeleteTarget: (s: Section | null) => void;
  deleteMutation: ReturnType<typeof useMutation<void, AxiosError<{ message: string }>, string>>;
}

export function useSections(): UseSectionsReturn {
  const queryClient = useQueryClient();
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  const { data: sections = [], isLoading } = useQuery({
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