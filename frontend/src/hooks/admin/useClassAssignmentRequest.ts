import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { classAssignmentRequestApi, type CreateRequestPayload } from "@/api/admin/class-assignment-request.api";

export const useClassAssignmentRequests = (filters?: { studentId?: string; schoolYearId?: string; status?: string }) => {
  return useAsyncQuery(
    ["admin", "classAssignmentRequests", filters] as unknown as readonly unknown[],
    () => classAssignmentRequestApi.list(filters),
  );
};

export const useCreateClassAssignmentRequest = () => {
  return useMutationWithInvalidation(
    (data: CreateRequestPayload) => classAssignmentRequestApi.create(data),
    { invalidateKeys: [["admin", "classAssignmentRequests"] as unknown as readonly unknown[]] },
  );
};

export const useFinalizeClassAssignmentRequest = () => {
  return useMutationWithInvalidation(
    ({ id, subjectIds }: { id: string; subjectIds: string[] }) =>
      classAssignmentRequestApi.finalize(id, subjectIds),
    { invalidateKeys: [["admin", "classAssignmentRequests"] as unknown as readonly unknown[]] },
  );
};

export const useReopenClassAssignmentRequest = () => {
  return useMutationWithInvalidation(
    ({ id, reason }: { id: string; reason?: string }) => classAssignmentRequestApi.reopen(id, reason),
    { invalidateKeys: [["admin", "classAssignmentRequests"] as unknown as readonly unknown[]] },
  );
};
