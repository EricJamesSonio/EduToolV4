// ===== File: frontend/src/hooks/admin/useGradingSchemeTemplates.ts =====

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from '@/hooks/hook-factory.utils'

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

export const useGradingSchemeTemplates = (
  programType?: string,
) => {
  return useAsyncQuery(
    gradingSchemeTemplateKeys.list(programType),
    () =>
      adminGradingSchemeTemplateApi.getAll(
        programType,
      ),
  )
}


// Query: Get single template

export const useGradingSchemeTemplate = (
  templateId: string,
) => {
  return useAsyncQuery(
    gradingSchemeTemplateKeys.detail(
      templateId,
    ),

    () =>
      adminGradingSchemeTemplateApi.getById(
        templateId,
      ),

    {
      enabled: !!templateId,
    },
  )
}


// Mutation: Create template

export const useCreateGradingSchemeTemplate =
  () => {
    return useMutationWithInvalidation(
      (
        data: CreateGradingSchemeTemplateDto,
      ) =>
        adminGradingSchemeTemplateApi.create(
          data,
        ),

      {
        invalidateKeys: [
          gradingSchemeTemplateKeys.all,
        ],
      },
    )
  }


// Mutation: Update template

export const useUpdateGradingSchemeTemplate =
  () => {
    return useMutationWithInvalidation(
      ({
        templateId,
        data,
      }: {
        templateId: string
        data: Partial<CreateGradingSchemeTemplateDto>
      }) =>
        adminGradingSchemeTemplateApi.update(
          templateId,
          data,
        ),

      {
        invalidateKeys: [
          gradingSchemeTemplateKeys.all,
        ],
      },
    )
  }


// Mutation: Delete template

export const useDeleteGradingSchemeTemplate =
  () => {
    return useMutationWithInvalidation(
      (templateId: string) =>
        adminGradingSchemeTemplateApi.delete(
          templateId,
        ),

      {
        invalidateKeys: [
          gradingSchemeTemplateKeys.all,
        ],
      },
    )
  }


// Mutation: Apply to single class

export const useApplyTemplateToClass =
  () => {
    return useMutationWithInvalidation(
      (
        payload: ApplyTemplateToClassDto,
      ) =>
        adminGradingSchemeTemplateApi.applyToClass(
          payload,
        ),

      {
        invalidateKeys: [
          ['grading-schemes'],
        ],
      },
    )
  }


// Mutation: Apply to program

export const useApplyTemplateToProgram =
  () => {
    return useMutationWithInvalidation(
      (payload: {
        programId: string
        templateId: string
        overwriteExisting?: boolean
      }) =>
        adminGradingSchemeTemplateApi.applyToProgram(
          payload,
        ),

      {
        invalidateKeys: [
          ['grading-schemes'],
          gradingSchemeTemplateKeys.all,
        ],
      },
    )
  }