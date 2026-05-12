// Courses Hook
// React Query hook for fetching courses for a specific program

import { useQuery } from '@tanstack/react-query';
import { courseApi } from '../api/course.api';

interface UseCoursesParams {
  programId: string;
}

export const useCourses = ({ programId }: UseCoursesParams) => {
  return useQuery({
    queryKey: ['courses', 'program', programId],
    queryFn: () => courseApi.getCoursesByProgram(programId),
    enabled: !!programId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
