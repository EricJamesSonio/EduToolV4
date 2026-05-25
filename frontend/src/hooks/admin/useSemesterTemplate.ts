// ===== File: frontend/src/hooks/admin/useSemesterTemplate.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { semesterTemplateApi } from "@/api/admin/semester-template.api";
import clientApi from "@/api/client";

import type {
  SemesterTemplateCreateDto,
  SemesterTemplateUpdateDto,
  AssignTemplateDto,
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";


// ─── Query: Get all templates ─────────────────────────────

export const useSemesterTemplates = () => {
  return useAsyncQuery<SemesterTemplate[]>(
    ["semester-templates"],
    semesterTemplateApi.getAll,
  );
};


// ─── Mutation: Create template ───────────────────────────

export const useCreateSemesterTemplate = () => {
  return useMutationWithInvalidation(
    (dto: SemesterTemplateCreateDto) =>
      semesterTemplateApi.create(dto),

    {
      invalidateKeys: [
        ["semester-templates"],
      ],
    },
  );
};


// ─── Mutation: Update template ───────────────────────────

export const useUpdateSemesterTemplate = () => {
  return useMutationWithInvalidation(
    ({
      id,
      dto,
    }: {
      id: string;
      dto: SemesterTemplateUpdateDto;
    }) =>
      semesterTemplateApi.update(id, dto),

    {
      invalidateKeys: [
        ["semester-templates"],
      ],
    },
  );
};


// ─── Mutation: Delete template ───────────────────────────

export const useDeleteSemesterTemplate = () => {
  return useMutationWithInvalidation(
    (id: string) =>
      semesterTemplateApi.delete(id),

    {
      invalidateKeys: [
        ["semester-templates"],
      ],
    },
  );
};


// ─── Query: Template assignments ─────────────────────────

export const useTemplateAssignments = (
  schoolYearId: string | null,
) => {
  return useAsyncQuery<TemplateAssignment[]>(
    [
      "semester-template-assignments",
      schoolYearId,
    ],

    () =>
      semesterTemplateApi.getAssignmentsBySchoolYear(
        schoolYearId!,
      ),

    {
      enabled: !!schoolYearId,
    },
  );
};


// ─── Query: Programs by school year ─────────────────────

export const useProgramsBySchoolYear = (
  schoolYearId: string | null,
) => {
  return useAsyncQuery<
    {
      id: string;
      name: string;
      type: string;
    }[]
  >(
    ["programs", schoolYearId],

    async () => {
      const res =
        await clientApi.get(
          `/programs?schoolYearId=${schoolYearId}`,
        );

      return res.data.data ?? [];
    },

    {
      enabled: !!schoolYearId,
    },
  );
};


// ─── Mutation: Assign template ───────────────────────────

export const useAssignTemplate = () => {
  return useMutationWithInvalidation(
    (dto: AssignTemplateDto) =>
      semesterTemplateApi.assign(dto),

    {
      invalidateKeys: [
        ["semester-template-assignments"],
      ],
    },
  );
};


// ─── Mutation: Remove assignment ─────────────────────────

export const useRemoveTemplateAssignment =
  () => {
    return useMutationWithInvalidation(
      (programId: string) =>
        semesterTemplateApi.removeAssignment(
          programId,
        ),

      {
        invalidateKeys: [
          ["semester-template-assignments"],
        ],
      },
    );
  };