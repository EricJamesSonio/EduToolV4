import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { classAssignmentRequestApi, type CreateRequestPayload } from "@/api/admin/class-assignment-request.api";

export const useClassAssignmentRequests = (filters?: { studentId?: string; schoolYearId?: string; status?: string; hasPrerequisiteWarning?: string }) => {
  return useAsyncQuery(
    ["admin", "classAssignmentRequests", filters] as unknown as readonly unknown[],
    () => classAssignmentRequestApi.list(filters as never),
  );
};

export const useCreateClassAssignmentRequest = () => {
  return useMutationWithInvalidation(
    (data: CreateRequestPayload) => classAssignmentRequestApi.create(data),
    { invalidateKeys: [["admin", "classAssignmentRequests"] as unknown as readonly unknown[]] },
  );
};

// Finalizing with approvedClassIds enrolls the student, so the student detail,
// enrollment lists and class rosters must refetch as well.
export const useFinalizeClassAssignmentRequest = () => {
  return useMutationWithInvalidation(
    ({
      id,
      approvedClassIds,
      subjectIds,
    }: {
      id: string;
      approvedClassIds?: string[];
      subjectIds?: string[];
    }) =>
      classAssignmentRequestApi.finalize(id, {
        approvedClassIds,
        adminFinalizedSubjectIds: subjectIds,
      }),
    {
      invalidateKeys: [
        ["admin", "classAssignmentRequests"] as unknown as readonly unknown[],
        ["admin", "students"] as unknown as readonly unknown[],
        ["admin", "classes"] as unknown as readonly unknown[],
      ],
    },
  );
};

export const useReopenClassAssignmentRequest = () => {
  return useMutationWithInvalidation(
    ({ id, reason }: { id: string; reason?: string }) => classAssignmentRequestApi.reopen(id, reason),
    { invalidateKeys: [["admin", "classAssignmentRequests"] as unknown as readonly unknown[]] },
  );
};