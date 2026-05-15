// ===== File: frontend/src/hooks/admin/useSections.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { sectionApi } from "@/api/admin/section.api";

import type {
  CreateSectionRequest,
  UpdateSectionRequest,
} from "@/api/admin/section.api";

import type {
  Section,
} from "@/types/admin/section.types";


const sectionKeys = {
  all: ["sections"] as const,

  list: (
    schoolYearId: string,
    levelId?: string,
  ) =>
    [
      "sections",
      schoolYearId,
      levelId,
    ] as const,
};


// ── GET sections ─────────────────────────────────────

export const useSections = (
  schoolYearId: string,
  levelId?: string,
) => {
  return useAsyncQuery<Section[]>(
    sectionKeys.list(
      schoolYearId,
      levelId,
    ),

    () =>
      sectionApi.getAll(
        schoolYearId,
        levelId,
      ),

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
          sectionKeys.all,
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
          sectionKeys.all,
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
          sectionKeys.all,
        ],
      },
    );
  };