// ===== File: frontend/src/hooks/educator/useGradingSchemes.ts =====

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api'
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

const KEYS = {
  all: ['grading-scheme'] as const,
  forClass: (classId: string) =>
    ['grading-scheme', 'class', classId] as const,
}

export const useClassGradingScheme = (classId: string) => {
  return useQuery({
    queryKey: KEYS.forClass(classId),
    queryFn: () => educatorGradingSchemeApi.getForClass(classId),
    enabled: !!classId,
  })
}

export const useCreateGradingScheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateGradingSchemeDto) =>
      educatorGradingSchemeApi.create(data),

    onSuccess: (data) => {
      // class-level refresh
      queryClient.invalidateQueries({
        queryKey: KEYS.forClass(data.classId),
      })

      // safety: global refresh (prevents stale lists elsewhere)
      queryClient.invalidateQueries({
        queryKey: KEYS.all,
      })
    },
  })
}

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

    onSuccess: (updated) => {
      // class-level refresh
      queryClient.invalidateQueries({
        queryKey: KEYS.forClass(updated.classId),
      })

      queryClient.invalidateQueries({
        queryKey: KEYS.all,
      })
    },
  })
}

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

      queryClient.invalidateQueries({
        queryKey: KEYS.all,
      })
    },
  })
}

export const useApplyTemplateToProgram = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      programId: string
      templateId: string
    }) => educatorGradingSchemeApi.applyTemplateToProgram(data),

    onSuccess: () => {
      // IMPORTANT: affects MANY classes
      queryClient.invalidateQueries({
        queryKey: KEYS.all,
      })
    },
  })
}