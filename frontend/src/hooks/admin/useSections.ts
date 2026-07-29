import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { sectionApi } from "@/api/admin/section.api";
import type {
  CreateSectionRequest,
  UpdateSectionRequest,
} from "@/api/admin/section.api";
import type {
  Section,
} from "@/types/admin/section.types";


// ── GET sections ─────────────────────────────────────

export const useSections = (
  schoolYearId: string,
  levelId?: string,
) => {
  return useAsyncQuery<Section[]>(
    queryKeys.admin.sections.list({ schoolYearId, levelId }),
    () => sectionApi.getAll(schoolYearId, levelId),

    {
      enabled:
        !!schoolYearId,
    },
  );
};


// ── CREATE section ──────────────────────────────────

export const useCreateSection =
  () => {
    return useMutationWithInvalidation(
      (
        data: CreateSectionRequest,
      ) =>
        sectionApi.create(
          data,
        ),

      {
        invalidateKeys: [
          queryKeys.admin.sections.all,
        ],
      },
    );
  };


// ── UPDATE section ──────────────────────────────────

export const useUpdateSection =
  () => {
    return useMutationWithInvalidation(
      ({
        id,
        data,
      }: {
        id: string;
        data: UpdateSectionRequest;
      }) =>
        sectionApi.update(
          id,
          data,
        ),

      {
        invalidateKeys: [
          queryKeys.admin.sections.all,
        ],
      },
    );
  };


// ── DELETE section ──────────────────────────────────

export const useDeleteSection =
  () => {
    return useMutationWithInvalidation(
      (id: string) =>
        sectionApi.delete(id),

      {
        invalidateKeys: [
          queryKeys.admin.sections.all,
        ],
      },
    );
  };