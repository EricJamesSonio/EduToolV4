import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';

export function useAppMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  if (process.env.NODE_ENV === 'development') {
    const mutationFnName = options.mutationFn?.name ?? 'anonymous';
    console.log(`[RQ] MUTATION ${mutationFnName}`);
  }

  return useMutation(options);
}
