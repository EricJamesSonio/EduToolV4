import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { studentClassRequestApi } from "@/api/student/class-request.api";
import {
  classAssignmentRequestApi,
  type CreateRequestPayload,
} from "@/api/admin/class-assignment-request.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

const AVAILABLE_KEY = ["student", "class-requests", "available"] as const;

export const useAvailableClassRequests = (enabled: boolean) => {
  return useAsyncQuery(AVAILABLE_KEY, () => studentClassRequestApi.getAvailable(), {
    enabled,
    meta: { preset: "detail", feature: "class-requests" },
  });
};

export const useSubmitClassRequest = () => {
  return useMutationWithInvalidation(
    (payload: CreateRequestPayload) => classAssignmentRequestApi.create(payload),
    {
      invalidateKeys: [
        AVAILABLE_KEY,
        queryKeys.student.classes.list(),
      ],
    },
  );
};