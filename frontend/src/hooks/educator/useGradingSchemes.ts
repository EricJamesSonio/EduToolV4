

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api'
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

const KEYS = {
  forClass: (classId: string) =>
    ['grading-scheme', 'class', classId] as const,
}

/**
 * Get grading scheme for a class
 */
export const useClassGradingScheme = (classId: string) => {
  return useQuery({
    queryKey: KEYS.forClass(classId),
    queryFn: () => educatorGradingSchemeApi.getForClass(classId),
    enabled: !!classId,
  })
}

/**
 * Create grading scheme (per class)
 */
export const useCreateGradingScheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateGradingSchemeDto) =>
      educatorGradingSchemeApi.create(data),

    onSuccess: (data) => {
      // ✅ refresh that specific class
      queryClient.invalidateQueries({
        queryKey: KEYS.forClass(data.classId),
      })
    },
  })
}

/**
 * Update grading scheme
 */
export const useUpdateGradingScheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateGradingSchemeDto
    }) => educatorGradingSchemeApi.update(id, data),

    onSuccess: (data) => {
      // ✅ refresh updated class
      queryClient.invalidateQueries({
        queryKey: KEYS.forClass(data.classId),
      })
    },
  })
}

/**
 * Apply template to a single class
 */
export const useApplyTemplateToClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      classId: string
      templateId: string
      name?: string
    }) => educatorGradingSchemeApi.applyTemplateToClass(data),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: KEYS.forClass(data.classId),
      })
    },
  })
}

/**
 * Apply template to program (admin bulk)
 */
export const useApplyTemplateToProgram = () => {
  return useMutation({
    mutationFn: (data: {
      programId: string
      templateId: string
    }) => educatorGradingSchemeApi.applyTemplateToProgram(data),
  })
}