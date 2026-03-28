import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api'
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

const KEYS = {
  default: ['grading-scheme', 'default']          as const,
  library: ['grading-scheme', 'educator-library'] as const,
}

// GET /grading-schemes/default — the org default (read-only for educators)
export const useDefaultGradingScheme = () => {
  return useQuery({
    queryKey: KEYS.default,
    queryFn:  educatorGradingSchemeApi.getDefault,
  })
}

// GET /grading-schemes — educator's own custom schemes
export const useGradingSchemeLibrary = () => {
  return useQuery({
    queryKey: KEYS.library,
    queryFn:  educatorGradingSchemeApi.getAll,
  })
}

// POST /grading-schemes
export const useCreateGradingScheme = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGradingSchemeDto) => educatorGradingSchemeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.library })
    },
  })
}

// PATCH /grading-schemes/:id
export const useUpdateGradingScheme = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradingSchemeDto }) =>
      educatorGradingSchemeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.library })
    },
  })
}