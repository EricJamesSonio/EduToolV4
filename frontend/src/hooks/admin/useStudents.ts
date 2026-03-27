import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { studentApi } from "@/api/admin/student.api";

// Reset student password
export const useResetStudentPassword = (): UseMutationResult<
  { password: string },
  unknown,
  string
> => {
  return useMutation<{ password: string }, unknown, string>({
    mutationFn: async (id: string) => {
      const { plainPassword } = await studentApi.resetPassword(id);
      return { password: plainPassword }; // rename for consistency
    },
  });
};