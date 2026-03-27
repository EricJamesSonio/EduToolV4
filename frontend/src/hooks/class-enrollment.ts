export const useClassEnrollments = (classId: string) => {
  return useQuery({
    queryKey: ["classes", classId, "enrollments"],
    queryFn: () => classApi.getEnrollments(classId),
    enabled: !!classId,
  });
};

export const useEnrollStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      studentId,
    }: {
      classId: string;
      studentId: string;
    }) => classApi.enroll(classId, studentId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};

export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
      status,
    }: {
      classId: string;
      enrollmentId: string;
      status: "active" | "pending" | "removed";
    }) => classApi.updateEnrollment(classId, enrollmentId, status),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};

export const useRemoveEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
    }: {
      classId: string;
      enrollmentId: string;
    }) => classApi.removeEnrollment(classId, enrollmentId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};