// frontend/src/hooks/admin/useStrands.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { strandApi } from "@/api/admin/strand.api";
import type { Strand } from "@/types/admin/strand.types";
import type {
  CreateStrandRequest,
  UpdateStrandRequest,
  GetStrandsQuery,
} from "@/api/admin/strand.api";

export const useStrands = (
  query?: GetStrandsQuery,
): UseQueryResult<Strand[], unknown> => {
  return useQuery<Strand[], unknown>({
    queryKey: ["strands", query],
    queryFn: () => strandApi.getAll(query),
  });
};

export const useStrand = (id: string): UseQueryResult<Strand, unknown> => {
  return useQuery<Strand, unknown>({
    queryKey: ["strands", id],
    queryFn: () => strandApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateStrand = (): UseMutationResult<
  Strand,
  unknown,
  CreateStrandRequest
> => {
  const queryClient = useQueryClient();
  return useMutation<Strand, unknown, CreateStrandRequest>({
    mutationFn: strandApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strands"] });
    },
  });
};

export const useUpdateStrand = (): UseMutationResult<
  Strand,
  unknown,
  { id: string; data: UpdateStrandRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation<Strand, unknown, { id: string; data: UpdateStrandRequest }>({
    mutationFn: ({ id, data }) => strandApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strands"] });
    },
  });
};

export const useDeleteStrand = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: strandApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strands"] });
    },
  });
};