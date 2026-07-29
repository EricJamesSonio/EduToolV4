import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { strandApi } from "@/api/admin/strand.api";
import type { Strand } from "@/types/admin/strand.types";
import type {
  CreateStrandRequest,
  UpdateStrandRequest,
  GetStrandsQuery,
} from "@/api/admin/strand.api";


// ── GET list ───────────────────────────────────────

export const useStrands = (
  query?: GetStrandsQuery,
) => {
  return useAsyncQuery<Strand[]>(
    queryKeys.admin.strands.list(query),
    () => strandApi.getAll(query),
  );
};


// ── GET single ─────────────────────────────────────

export const useStrand = (
  id: string,
) => {
  return useAsyncQuery<Strand>(
    queryKeys.admin.strands.detail(id),
    () => strandApi.getOne(id),

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
          queryKeys.admin.strands.all,
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
          queryKeys.admin.strands.all,
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
          queryKeys.admin.strands.all,
        ],
      },
    );
  };