import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api'
import type {
  CreateGradingSchemeRequest,
  UpdateGradingSchemeRequest,
  GetGradingSchemesQuery,
  CreateGradingSchemeComponentRequest,
  UpdateGradingSchemeComponentRequest,
} from '@/api/educator/grading-scheme.api'

const KEYS = {
  all: (q?: GetGradingSchemesQuery) => ['educator', 'grading-schemes', q] as const,
  one: (id: string)                 => ['educator', 'grading-schemes', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useEducatorGradingSchemes(query?: GetGradingSchemesQuery) {
  return useQuery({
    queryKey: KEYS.all(query),
    queryFn:  () => educatorGradingSchemeApi.getAll(query),
  })
}

export function useEducatorGradingScheme(id: string) {
  return useQuery({
    queryKey: KEYS.one(id),
    queryFn:  () => educatorGradingSchemeApi.getOne(id),
    enabled:  !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateEducatorGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGradingSchemeRequest) => educatorGradingSchemeApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['educator', 'grading-schemes'] }),
  })
}

export function useUpdateEducatorGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradingSchemeRequest }) =>
      educatorGradingSchemeApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['educator', 'grading-schemes'] })
      qc.invalidateQueries({ queryKey: KEYS.one(id) })
    },
  })
}

export function useDeleteEducatorGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => educatorGradingSchemeApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['educator', 'grading-schemes'] }),
  })
}

export function useAssignGradingSchemeToClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, classId }: { id: string; classId: string }) =>
      educatorGradingSchemeApi.assignToClass(id, classId),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['educator', 'grading-schemes'] })
      qc.invalidateQueries({ queryKey: KEYS.one(id) })
    },
  })
}

// ── Component mutations ───────────────────────────────────────────────────────

export function useAddEducatorGradingSchemeComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schemeId, data }: { schemeId: string; data: CreateGradingSchemeComponentRequest }) =>
      educatorGradingSchemeApi.addComponent(schemeId, data),
    onSuccess: (_, { schemeId }) => qc.invalidateQueries({ queryKey: KEYS.one(schemeId) }),
  })
}

export function useUpdateEducatorGradingSchemeComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      schemeId,
      componentId,
      data,
    }: {
      schemeId:    string
      componentId: string
      data:        UpdateGradingSchemeComponentRequest
    }) => educatorGradingSchemeApi.updateComponent(schemeId, componentId, data),
    onSuccess: (_, { schemeId }) => qc.invalidateQueries({ queryKey: KEYS.one(schemeId) }),
  })
}

export function useDeleteEducatorGradingSchemeComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schemeId, componentId }: { schemeId: string; componentId: string }) =>
      educatorGradingSchemeApi.deleteComponent(schemeId, componentId),
    onSuccess: (_, { schemeId }) => qc.invalidateQueries({ queryKey: KEYS.one(schemeId) }),
  })
}