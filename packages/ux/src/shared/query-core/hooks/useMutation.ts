import {
    useMutation as useTanstackMutation,
    UseMutationOptions,
    UseMutationResult
} from '@tanstack/react-query';

import { Logger } from '@safely/sync';

import { useLogger } from '../../logger';

export type MutationOptions<TData, TError, TVars, TContext> = Omit<
    UseMutationOptions<TData, TError, TVars, TContext>,
    'mutationFn'
> & {
    mutationFn: (variables: TVars, logger: Logger) => Promise<TData>;
};

export function useMutation<TData = unknown, TError = Error, TVars = void, TContext = unknown>(
    options: MutationOptions<TData, TError, TVars, TContext>
): UseMutationResult<TData, TError, TVars, TContext> {
    const hookLogger = useLogger();

    return useTanstackMutation<TData, TError, TVars, TContext>({
        ...options,
        async mutationFn(vars) {
            try {
                return await options.mutationFn(vars, hookLogger);
            } catch (e) {
                hookLogger.error(e);
                throw e;
            }
        }
    });
}
