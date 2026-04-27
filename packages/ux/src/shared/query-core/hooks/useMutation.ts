import {
    useMutation as useTanstackMutation,
    UseMutationOptions,
    UseMutationResult
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { Logger } from '@safely/sync';

import { useLogger } from '../../logger';

const LOGGER_KEY = Symbol('useMutation.logger');
const VARS_KEY = Symbol('useMutation.variables');

type Internal<TVars> = { [VARS_KEY]: TVars; [LOGGER_KEY]: Logger };

export type MutationOptions<TData, TError, TVars, TContext> = Omit<
    UseMutationOptions<TData, TError, TVars, TContext>,
    'mutationFn'
> & {
    mutationFn: (variables: TVars, logger?: Logger) => Promise<TData>;
};

function unwrap<TVars>(args: Internal<TVars>): { logger: Logger; variables: TVars } {
    return { logger: args[LOGGER_KEY], variables: args[VARS_KEY] };
}

export function useMutation<TData = unknown, TError = Error, TVars = void, TContext = unknown>(
    options: MutationOptions<TData, TError, TVars, TContext>
): UseMutationResult<TData, TError, TVars, TContext> {
    const hookLogger = useLogger();

    const internal = useTanstackMutation<TData, TError, Internal<TVars>, TContext>({
        ...options,
        async mutationFn(args) {
            const { logger, variables } = unwrap<TVars>(args);
            try {
                return await options.mutationFn(variables, logger);
            } catch (e) {
                logger.error(e);
                throw e;
            }
        },
        onMutate: options.onMutate
            ? (args, ctx) => options.onMutate!(unwrap<TVars>(args).variables, ctx)
            : undefined,
        onSuccess: options.onSuccess
            ? (data, args, onMutateResult, ctx) =>
                  options.onSuccess!(data, unwrap<TVars>(args).variables, onMutateResult, ctx)
            : undefined,
        onError: options.onError
            ? (error, args, onMutateResult, ctx) =>
                  options.onError!(error, unwrap<TVars>(args).variables, onMutateResult, ctx)
            : undefined,
        onSettled: options.onSettled
            ? (data, error, args, onMutateResult, ctx) =>
                  options.onSettled!(
                      data,
                      error,
                      unwrap<TVars>(args).variables,
                      onMutateResult,
                      ctx
                  )
            : undefined
    });

    const mutate = useCallback(
        ((vars: TVars, opts?: Parameters<typeof internal.mutate>[1]) => {
            const augmented: Internal<TVars> = {
                [VARS_KEY]: vars,
                [LOGGER_KEY]: hookLogger
            };
            return internal.mutate(augmented, opts);
        }) as UseMutationResult<TData, TError, TVars, TContext>['mutate'],
        [internal, hookLogger]
    );

    const mutateAsync = useCallback(
        ((vars: TVars, opts?: Parameters<typeof internal.mutateAsync>[1]) => {
            const augmented: Internal<TVars> = {
                [VARS_KEY]: vars,
                [LOGGER_KEY]: hookLogger
            };
            return internal.mutateAsync(augmented, opts);
        }) as UseMutationResult<TData, TError, TVars, TContext>['mutateAsync'],
        [internal, hookLogger]
    );

    return {
        ...internal,
        mutate,
        mutateAsync,
        variables: internal.variables
            ? unwrap<TVars>(internal.variables).variables
            : (undefined as TVars | undefined)
    } as UseMutationResult<TData, TError, TVars, TContext>;
}
