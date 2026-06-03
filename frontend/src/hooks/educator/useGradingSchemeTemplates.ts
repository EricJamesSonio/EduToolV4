import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api'
import type {
  GradingSchemeTemplate,
  CreateGradingSchemeTemplateDto,
} from '@/types/admin/grading-scheme-template.types'

const KEYS = {
  all: ['grading-scheme-templates', 'educator'] as const,
  list: (programType?: string) =>
    ['grading-scheme-templates', 'educator', 'list', programType] as const,
  detail: (templateId: string) =>
    ['grading-scheme-templates', 'educator', 'detail', templateId] as const,
}

export const useEducatorTemplateLibrary = (programType?: string) => {
  return useQuery({
    queryKey: KEYS.list(programType),
    queryFn: () => educatorGradingSchemeApi.getTemplates(programType),
  })
}

export const useEducatorTemplate = (templateId: string) => {
  return useQuery({
    queryKey: KEYS.detail(templateId),
    queryFn: () => educatorGradingSchemeApi.getTemplate(templateId),
    enabled: !!templateId,
  })
}

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateGradingSchemeTemplateDto) =>
      educatorGradingSchemeApi.createTemplate(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string
      data: Partial<CreateGradingSchemeTemplateDto>
    }) => educatorGradingSchemeApi.updateTemplate(templateId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string) =>
      educatorGradingSchemeApi.deleteTemplate(templateId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}
