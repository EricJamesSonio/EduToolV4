// frontend/src/hooks/admin/useStrands.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { strandApi } from "@/api/admin/strand.api";

import type { Strand } from "@/types/admin/strand.types";
import type {
  CreateStrandRequest,
  UpdateStrandRequest,
  GetStrandsQuery,
} from "@/api/admin/strand.api";


const strandKeys = {
  all: ["strands"] as const,

  list: (query?: GetStrandsQuery) =>
    ["strands", query] as const,

  detail: (id: string) =>
    ["strands", id] as const,
};


// ── GET list ───────────────────────────────────────

export const useStrands = (
  query?: GetStrandsQuery,
) => {
  return useAsyncQuery<Strand[]>(
    strandKeys.list(query),

    () =>
      strandApi.getAll(query),
  );
};


// ── GET single ─────────────────────────────────────

export const useStrand = (
  id: string,
) => {
  return useAsyncQuery<Strand>(
    strandKeys.detail(id),

    () =>
      strandApi.getOne(id),

    {
      enabled: !!id,
    },
  );
};


// ── CREATE ─────────────────────────────────────────

export const useCreateStrand =
  () => {
    return useMutationWithInvalidation(
      (data: CreateStrandRequest) =>
        strandApi.create(data),

      {
        invalidateKeys: [
          strandKeys.all,
        ],
      },
    );
  };


// ── UPDATE ─────────────────────────────────────────

export const useUpdateStrand =
  () => {
    return useMutationWithInvalidation(
      ({
        id,
        data,
      }: {
        id: string;
        data: UpdateStrandRequest;
      }) =>
        strandApi.update(id, data),

      {
        invalidateKeys: [
          strandKeys.all,
        ],
      },
    );
  };


// ── DELETE ─────────────────────────────────────────

export const useDeleteStrand =
  () => {
    return useMutationWithInvalidation(
      (id: string) =>
        strandApi.remove(id),

      {
        invalidateKeys: [
          strandKeys.all,
        ],
      },
    );
  };