import { useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { sectionApi, DEFAULT_PAGE_SIZE } from "@/api/admin/section.api";
import type { PaginatedResponse } from "@/types/api.types";
import type { Section } from "@/types/admin/section.types";
import type { AxiosError } from "axios";

export interface SectionPageParams {
  search?: string;
  page?:   number;
  limit?:  number;
}

export function useSections(
  schoolYearId: string | null,
  pageParams: SectionPageParams = {},
) {
  const search = pageParams.search ?? "";
  const page   = pageParams.page ?? 1;
  const limit  = pageParams.limit ?? DEFAULT_PAGE_SIZE;

  const [filterProgramId, setFilterProgramId] = useState<string>("all");
  const [filterCourseId, setFilterCourseId] = useState<string>("all");
  const [filterStrandId, setFilterStrandId] = useState<string>("all");
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  const listFilters = {
    schoolYearId: schoolYearId ?? undefined,
    levelId:      filterLevelId   !== "all" ? filterLevelId   : undefined,
    courseId:     filterCourseId  !== "all" ? filterCourseId  : undefined,
    strandId:     filterStrandId  !== "all" ? filterStrandId  : undefined,
    programId:    filterProgramId !== "all" ? filterProgramId : undefined,
    search:       search || undefined,
  };

  const {
    data: sectionsResp,
    isLoading,
    isError,
    refetch,
  } = useAsyncQuery<PaginatedResponse<Section>>(
    [...queryKeys.admin.sections.list(listFilters), page, limit],
    () => sectionApi.getPage({ ...listFilters, page, limit }),
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

  const deleteMutation = useMutationWithInvalidation(
    (id: string) => sectionApi.delete(id),
    {
      invalidateKeys: [
        queryKeys.admin.sections.all,
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
    sections: sectionsResp?.data ?? [],
    total: sectionsResp?.meta?.total ?? 0,
    totalPages: sectionsResp?.meta?.totalPages ?? 1,
    isLoading,
    isError,
    refetch,
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
