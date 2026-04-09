// ===== File: frontend/src/hooks/admin/useSemesterTemplate.ts =====
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { semesterTemplateApi } from '@/api/admin/semester-template.api'
import type {
  SemesterTemplateCreateDto,
  SemesterTemplateUpdateDto,
  AssignTemplateDto,
  SemesterTemplate,
  TemplateAssignment,
} from '@/types/admin/semester-template.types'
import clientApi from '@/api/client'

// ─── Get all templates (no school-year filter) ──────────────────────────────
export const useSemesterTemplates = () =>
  useQuery<SemesterTemplate[]>({
    queryKey: ['semester-templates'],
    queryFn: () => semesterTemplateApi.getAll(),
    enabled: true, // Always enabled
  })

// ─── Create a new template ──────────────────────────────────────────────────
export const useCreateSemesterTemplate = () => {
  const qc = useQueryClient()
  return useMutation<SemesterTemplate, unknown, SemesterTemplateCreateDto>({
    mutationFn: (dto) => semesterTemplateApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semester-templates'] }) // ✅ TS-safe
    },
  })
}

// ─── Update a template ─────────────────────────────────────────────────────
export const useUpdateSemesterTemplate = () => {
  const qc = useQueryClient()
  return useMutation<SemesterTemplate, unknown, { id: string; dto: SemesterTemplateUpdateDto }>({
    mutationFn: ({ id, dto }) => semesterTemplateApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semester-templates'] })
    },
  })
}

// ─── Delete a template ─────────────────────────────────────────────────────
export const useDeleteSemesterTemplate = () => {
  const qc = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: (id) => semesterTemplateApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semester-templates'] })
    },
  })
}

// ─── Get all template assignments (no school-year filter) ──────────────────
// REPLACE useTemplateAssignments with this:
export const useTemplateAssignments = (schoolYearId: string | null) =>
  useQuery<TemplateAssignment[]>({
    queryKey: ['semester-template-assignments', schoolYearId],
    queryFn: () => semesterTemplateApi.getAssignmentsBySchoolYear(schoolYearId!),
    enabled: !!schoolYearId,
  })

  // ADD this new hook for school-year-scoped programs:
export const useProgramsBySchoolYear = (schoolYearId: string | null) =>
  useQuery<{ id: string; name: string; type: string }[]>({
    queryKey: ['programs', schoolYearId],
    queryFn: async () => {
      const res = await clientApi.get(`/programs?schoolYearId=${schoolYearId}`)
      return res.data.data ?? []
    },
    enabled: !!schoolYearId,
  })

// ─── Assign a template to a program ────────────────────────────────────────
export const useAssignTemplate = () => {
  const qc = useQueryClient()
  return useMutation<TemplateAssignment, unknown, AssignTemplateDto>({
    mutationFn: (dto) => semesterTemplateApi.assign(dto),
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['semester-template-assignments'] }) // invalidates all variants
}
  })
}

// ─── Remove a template assignment from a program ───────────────────────────
export const useRemoveTemplateAssignment = () => {
  const qc = useQueryClient()
  return useMutation<void, unknown, string>({
    mutationFn: (programId) => semesterTemplateApi.removeAssignment(programId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semester-template-assignments'] })
    },
  })
}