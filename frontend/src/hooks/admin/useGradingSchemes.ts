import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGradingSchemeApi } from '@/api/admin/grading-scheme.api'
import type { UpdateDefaultGradingSchemeDto } from '@/types/admin/grading-scheme.types'

const QUERY_KEY = ['grading-scheme', 'default'] as const

export const useGradingScheme = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn:  adminGradingSchemeApi.getDefault,
  })
}

export const useUpdateGradingScheme = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDefaultGradingSchemeDto) =>
      adminGradingSchemeApi.updateDefault(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}