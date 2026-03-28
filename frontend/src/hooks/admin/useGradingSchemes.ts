import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gradingSchemeApi } from '@/api/admin/grading-scheme.api'
import type {
  CreateGradingSchemeRequest,
  UpdateGradingSchemeRequest,
  GetGradingSchemesQuery,
  CreateGradingSchemeComponentRequest,
  UpdateGradingSchemeComponentRequest,
} from '@/api/admin/grading-scheme.api'

const KEYS = {
  all:  (q?: GetGradingSchemesQuery) => ['grading-schemes', q] as const,
  one:  (id: string)                 => ['grading-schemes', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useGradingSchemes(query?: GetGradingSchemesQuery) {
  return useQuery({
    queryKey: KEYS.all(query),
    queryFn:  () => gradingSchemeApi.getAll(query),
  })
}

export function useGradingScheme(id: string) {
  return useQuery({
    queryKey: KEYS.one(id),
    queryFn:  () => gradingSchemeApi.getOne(id),
    enabled:  !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGradingSchemeRequest) => gradingSchemeApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['grading-schemes'] }),
  })
}

export function useUpdateGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradingSchemeRequest }) =>
      gradingSchemeApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['grading-schemes'] })
      qc.invalidateQueries({ queryKey: KEYS.one(id) })
    },
  })
}

export function useDeleteGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gradingSchemeApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['grading-schemes'] }),
  })
}

export function useSetDefaultGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gradingSchemeApi.setDefault(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['grading-schemes'] }),
  })
}

export function useLockGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gradingSchemeApi.lock(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['grading-schemes'] })
      qc.invalidateQueries({ queryKey: KEYS.one(id) })
    },
  })
}

export function useUnlockGradingScheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gradingSchemeApi.unlock(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['grading-schemes'] })
      qc.invalidateQueries({ queryKey: KEYS.one(id) })
    },
  })
}

// ── Component mutations ───────────────────────────────────────────────────────

export function useAddGradingSchemeComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schemeId, data }: { schemeId: string; data: CreateGradingSchemeComponentRequest }) =>
      gradingSchemeApi.addComponent(schemeId, data),
    onSuccess: (_, { schemeId }) => qc.invalidateQueries({ queryKey: KEYS.one(schemeId) }),
  })
}

export function useUpdateGradingSchemeComponent() {
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
    }) => gradingSchemeApi.updateComponent(schemeId, componentId, data),
    onSuccess: (_, { schemeId }) => qc.invalidateQueries({ queryKey: KEYS.one(schemeId) }),
  })
}

export function useDeleteGradingSchemeComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schemeId, componentId }: { schemeId: string; componentId: string }) =>
      gradingSchemeApi.deleteComponent(schemeId, componentId),
    onSuccess: (_, { schemeId }) => qc.invalidateQueries({ queryKey: KEYS.one(schemeId) }),
  })
}