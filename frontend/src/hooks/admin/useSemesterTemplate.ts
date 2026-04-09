import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { semesterTemplateApi } from '@/api/admin/semester-template.api'
import type {
  SemesterTemplateCreateDto,
  SemesterTemplateUpdateDto,
  AssignTemplateDto,
} from '@/types/admin/semester-template.types'

export const useSemesterTemplates = (schoolYearId: string) =>
  useQuery({
    queryKey: ['semester-templates', schoolYearId],
    queryFn: () => semesterTemplateApi.getAll(schoolYearId),
    enabled: !!schoolYearId,
  })

export const useCreateSemesterTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: SemesterTemplateCreateDto) => semesterTemplateApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['semester-templates'] }),
  })
}

export const useUpdateSemesterTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SemesterTemplateUpdateDto }) =>
      semesterTemplateApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['semester-templates'] }),
  })
}

export const useDeleteSemesterTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => semesterTemplateApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['semester-templates'] }),
  })
}

export const useTemplateAssignments = (schoolYearId: string) =>
  useQuery({
    queryKey: ['semester-template-assignments', schoolYearId],
    queryFn: () => semesterTemplateApi.getAssignments(schoolYearId),
    enabled: !!schoolYearId,
  })

export const useAssignTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: AssignTemplateDto) => semesterTemplateApi.assign(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['semester-template-assignments'] }),
  })
}

export const useRemoveTemplateAssignment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (programId: string) => semesterTemplateApi.removeAssignment(programId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['semester-template-assignments'] }),
  })
}