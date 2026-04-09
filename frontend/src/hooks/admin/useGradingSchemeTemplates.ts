// ===== File: frontend\src\hooks\admin\useGradingSchemeTemplates.ts =====
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGradingSchemeTemplateApi } from '@/api/admin/grading-scheme-template.api'
import type {
  CreateGradingSchemeTemplateDto,
  ApplyTemplateToClassDto,
} from '@/types/admin/grading-scheme-template.types'

const gradingSchemeTemplateKeys = {
  all: ['grading-scheme-templates'] as const,
  list: (programType?: string) =>
    ['grading-scheme-templates', 'list', programType] as const,
  detail: (templateId: string) =>
    ['grading-scheme-templates', 'detail', templateId] as const,
}

// Query: Get all templates
export const useGradingSchemeTemplates = (programType?: string) => {
  return useQuery({
    queryKey: gradingSchemeTemplateKeys.list(programType),
    queryFn: () => adminGradingSchemeTemplateApi.getAll(programType),
  })
}

// Query: Get single template
export const useGradingSchemeTemplate = (templateId: string) => {
  return useQuery({
    queryKey: gradingSchemeTemplateKeys.detail(templateId),
    queryFn: () => adminGradingSchemeTemplateApi.getById(templateId),
    enabled: !!templateId,
  })
}

// Mutation: Create template
export const useCreateGradingSchemeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGradingSchemeTemplateDto) =>
      adminGradingSchemeTemplateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingSchemeTemplateKeys.all,
      })
    },
  })
}

// Mutation: Update template
export const useUpdateGradingSchemeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string
      data: Partial<CreateGradingSchemeTemplateDto>
    }) => adminGradingSchemeTemplateApi.update(templateId, data),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({
        queryKey: gradingSchemeTemplateKeys.detail(templateId),
      })
      queryClient.invalidateQueries({
        queryKey: gradingSchemeTemplateKeys.all,
      })
    },
  })
}

// Mutation: Delete template
export const useDeleteGradingSchemeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) =>
      adminGradingSchemeTemplateApi.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradingSchemeTemplateKeys.all,
      })
    },
  })
}

// Mutation: Apply to single class
export const useApplyTemplateToClass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApplyTemplateToClassDto) =>
      adminGradingSchemeTemplateApi.applyToClass(payload),
    onSuccess: () => {
      // Invalidate grading schemes for the affected class
      queryClient.invalidateQueries({
        queryKey: ['grading-schemes'],
      })
    },
  })
}

// Mutation: Apply to program (bulk to all classes)
export const useApplyTemplateToProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      programId: string
      templateId: string
      overwriteExisting?: boolean
    }) => adminGradingSchemeTemplateApi.applyToProgram(payload),
    onSuccess: () => {
      // Invalidate all grading schemes since bulk operation
      queryClient.invalidateQueries({
        queryKey: ['grading-schemes'],
      })
      queryClient.invalidateQueries({
        queryKey: gradingSchemeTemplateKeys.all,
      })
    },
  })
}