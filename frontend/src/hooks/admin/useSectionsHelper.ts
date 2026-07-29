import { useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { AxiosError } from "axios";

export function useSections(schoolYearId: string | null) {
  const [filterProgramId, setFilterProgramId] = useState<string>("all");
  const [filterCourseId, setFilterCourseId] = useState<string>("all");
  const [filterStrandId, setFilterStrandId] = useState<string>("all");
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  const { data: allSections = [], isLoading } = useAsyncQuery<Section[]>(
    queryKeys.admin.sections.list({ schoolYearId }),
    () => sectionApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  function handleSetFilterProgramId(id: string) {
    setFilterProgramId(id);
    setFilterCourseId("all");
    setFilterStrandId("all");
    setFilterLevelId("all");
  }

  function handleSetFilterCourseId(id: string) {
    setFilterCourseId(id);
    setFilterLevelId("all");
  }

  function handleSetFilterStrandId(id: string) {
    setFilterStrandId(id);
    setFilterLevelId("all");
  }

  const sections = allSections.filter((s) => {
    const matchesLevel =
      filterLevelId === "all" || s.level_id === filterLevelId;
    const matchesCourse =
      filterCourseId === "all" ||
      (s as Section & { course_id?: string }).course_id === filterCourseId;
    const matchesStrand =
      filterStrandId === "all" ||
      (s as Section & { strand_id?: string }).strand_id === filterStrandId;
    return matchesLevel && matchesCourse && matchesStrand;
  });

  const deleteMutation = useMutationWithInvalidation(
    (id: string) => sectionApi.delete(id),
    {
      invalidateKeys: [
        queryKeys.admin.sections.list({ schoolYearId }),
        queryKeys.admin.levels.list({ schoolYearId }),
        queryKeys.admin.programs.list({ schoolYearId }),
      ],
      onSuccess: () => {
        toast.success("Section deleted.");
        setDeleteTarget(null);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to delete section.");
        setDeleteTarget(null);
      },
    },
  );

  return {
    sections,
    isLoading,
    filterProgramId,
    setFilterProgramId: handleSetFilterProgramId,
    filterCourseId,
    setFilterCourseId: handleSetFilterCourseId,
    filterStrandId,
    setFilterStrandId: handleSetFilterStrandId,
    filterLevelId,
    setFilterLevelId,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  };
}
