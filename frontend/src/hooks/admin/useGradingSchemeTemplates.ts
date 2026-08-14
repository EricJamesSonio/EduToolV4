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

import { queryKeys } from "@/hooks/queryKeys.factory"


// Query: Get all templates

export const useGradingSchemeTemplates = (
  programType?: string,
) => {
  return useAsyncQuery(
    queryKeys.admin.gradingSchemeTemplates.list({ programType }),
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
    queryKeys.admin.gradingSchemeTemplates.detail(templateId),

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
          queryKeys.admin.gradingSchemeTemplates.all,
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
          queryKeys.admin.gradingSchemeTemplates.all,
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
          queryKeys.admin.gradingSchemeTemplates.all,
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
          queryKeys.admin.gradingSchemes.all,
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
          queryKeys.admin.gradingSchemes.all,
          queryKeys.admin.gradingSchemeTemplates.all,
        ],
      },
    )
  }


// Query: Program assignments

export const useGradingSchemeProgramAssignments = (
  schoolYearId?: string | null,
) => {
  return useAsyncQuery(
    queryKeys.admin.gradingSchemeTemplates.programAssignments(schoolYearId),
    () =>
      adminGradingSchemeTemplateApi.getProgramAssignments(
        schoolYearId ?? undefined,
      ),
    { enabled: !!schoolYearId },
  )
}


// Query: Class assignments

export const useGradingSchemeClassAssignments = (
  schoolYearId?: string | null,
) => {
  return useAsyncQuery(
    queryKeys.admin.gradingSchemeTemplates.classAssignments(schoolYearId),
    () =>
      adminGradingSchemeTemplateApi.getClassAssignments(
        schoolYearId ?? undefined,
      ),
    { enabled: !!schoolYearId },
  )
}


// Mutation: Remove program assignment

export const useRemoveGradingSchemeProgramAssignment =
  () => {
    return useMutationWithInvalidation(
      (payload: { programId: string; schoolYearId?: string | null }) =>
        adminGradingSchemeTemplateApi.removeProgramAssignment(
          payload.programId,
          payload.schoolYearId ?? undefined,
        ),
      {
        invalidateKeys: [
          ["admin", "gradingSchemeTemplates", "programAssignments"],
        ],
      },
    )
  }