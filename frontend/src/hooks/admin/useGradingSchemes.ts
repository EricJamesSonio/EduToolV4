// ===== File: frontend/src/hooks/admin/useGradingSchemes.ts =====

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGradingSchemeApi } from '@/api/admin/grading-scheme.api'

import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
  ApplyToProgramPayload,
} from '@/types/admin/grading-scheme.types'

// ========================================
// QUERY KEYS
// ========================================

const gradingSchemeKeys = {
  all: ['grading-schemes'] as const,
  byClass: (classId: string) => ['grading-schemes', 'class', classId] as const,
  templates: (programType?: string) =>
    ['grading-schemes', 'templates', programType] as const,
}

// ========================================
// GET BY CLASS
// ========================================

export const useGradingSchemeByClass = (classId: string) => {
  return useQuery({
    queryKey: gradingSchemeKeys.byClass(classId),
    queryFn: () => adminGradingSchemeApi.getByClass(classId),
    enabled: !!classId,
  })
}

// ========================================
// CREATE
// ========================================

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

// ========================================
// UPDATE
// ========================================

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

// ========================================
// TEMPLATES
// ========================================

export const useGradingSchemeTemplates = (programType?: string) => {
  return useQuery({
    queryKey: gradingSchemeKeys.templates(programType),
    queryFn: () => adminGradingSchemeApi.getTemplates(programType),
  })
}

// ========================================
// APPLY TEMPLATE → CLASS
// ========================================

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

// ========================================
// APPLY TEMPLATE → PROGRAM (BULK)
// ========================================

export const useApplyTemplateToProgram = () => {
  return useMutation({
    mutationFn: (payload: ApplyToProgramPayload) =>
      adminGradingSchemeApi.applyToProgram(payload),
  })
}