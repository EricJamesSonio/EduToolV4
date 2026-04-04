import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api'
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

const KEYS = {
  default:          ['grading-scheme', 'default']           as const,
  library:          ['grading-scheme', 'educator-library']  as const,
  forClass: (classId: string) => ['grading-scheme', 'class', classId] as const,
}

export const useDefaultGradingScheme = () => {
  return useQuery({
    queryKey: KEYS.default,
    queryFn:  educatorGradingSchemeApi.getDefault,
  })
}

export const useGradingSchemeLibrary = () => {
  return useQuery({
    queryKey: KEYS.library,
    queryFn:  educatorGradingSchemeApi.getAll,
  })
}

export const useClassGradingScheme = (classId: string) => {
  return useQuery({
    queryKey: KEYS.forClass(classId),
    queryFn:  () => educatorGradingSchemeApi.getForClass(classId),
    enabled:  !!classId,
  })
}

export const useCreateGradingScheme = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGradingSchemeDto) =>
      educatorGradingSchemeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.library })
    },
  })
}

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

export const useSaveClassGradingScheme = (classId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateGradingSchemeDto) =>
      educatorGradingSchemeApi.saveForClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.forClass(classId) })
    },
  })
}