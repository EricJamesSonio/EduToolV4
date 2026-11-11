import { useQueryClient, type QueryKey } from "@tanstack/react-query"
import { useAppMutation } from "@/hooks/useAppMutation"
import { showErrorToast } from "@/lib/error-handling"

interface UseOptimisticMutationOptions<TData, TVariables, TCache> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey: QueryKey
  applyOptimistic: (
    current: TCache | undefined,
    variables: TVariables,
  ) => TCache | undefined
  errorMessage: string
  onSuccess?: (data: TData, variables: TVariables) => void
}

interface OptimisticContext<TCache> {
  previous: TCache | undefined
}

export function useOptimisticMutation<TData, TVariables, TCache>(
  options: UseOptimisticMutationOptions<TData, TVariables, TCache>,
) {
  const queryClient = useQueryClient()
  const { mutationFn, queryKey, applyOptimistic, errorMessage, onSuccess } =
    options

  return useAppMutation<TData, Error, TVariables, OptimisticContext<TCache>>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TCache>(queryKey)
      queryClient.setQueryData<TCache | undefined>(queryKey, (current) =>
        applyOptimistic(current, variables),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData<TCache | undefined>(queryKey, context?.previous)
      showErrorToast(error, errorMessage)
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}