import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGradingSchemeApi } from '@/api/admin/grading-scheme.api'
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

const gradingSchemeKeys = {
  all: ['grading-schemes'] as const,
  byClass: (classId: string) =>
    ['grading-schemes', 'class', classId] as const,
}

// Query: Get grading scheme for a specific class
export const useGradingSchemeByClass = (classId: string) => {
  return useQuery({
    queryKey: gradingSchemeKeys.byClass(classId),
    queryFn: () => adminGradingSchemeApi.getByClass(classId),
    enabled: !!classId,
  })
}

// Mutation: Create grading scheme
export const useCreateGradingScheme = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGradingSchemeDto) =>
      adminGradingSchemeApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: gradingSchemeKeys.byClass(data.classId),
      })
    },
  })
}

// Mutation: Update grading scheme
export const useUpdateGradingScheme = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      schemeId,
      data,
    }: {
      schemeId: string
      data: UpdateGradingSchemeDto
    }) => adminGradingSchemeApi.update(schemeId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: gradingSchemeKeys.byClass(data.classId),
      })
    },
  })
}

// Mutation: Apply template to single class
export const useApplyTemplateToClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      classId: string
      templateId: string
      name?: string
    }) => adminGradingSchemeApi.applyToClass(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: gradingSchemeKeys.byClass(data.classId),
      })
    },
  })
}

// Mutation: Apply template to program (bulk to all classes)
export const useApplyTemplateToProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      programId: string
      templateId: string
      overwriteExisting?: boolean
    }) => adminGradingSchemeApi.applyToProgram(payload),
    onSuccess: () => {
      // Invalidate all grading schemes since bulk operation
      queryClient.invalidateQueries({
        queryKey: gradingSchemeKeys.all,
      })
    },
  })
}