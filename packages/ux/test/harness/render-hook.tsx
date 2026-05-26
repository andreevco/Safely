import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import type { IAppContext } from '../../src/shared/providers/AppContext';
import { AppContext } from '../../src/shared/providers/AppContext';

export type RenderHookWithProvidersOptions<TProps> = RenderHookOptions<TProps> & {
    appContext: IAppContext;
    queryClient?: QueryClient;
};

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: Infinity },
            mutations: { retry: false }
        }
    });
}

export function renderHookWithProviders<TResult, TProps>(
    callback: (props: TProps) => TResult,
    options: RenderHookWithProvidersOptions<TProps>
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } {
    const queryClient = options.queryClient ?? createTestQueryClient();

    const wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={queryClient}>
            <AppContext.Provider value={options.appContext}>{children}</AppContext.Provider>
        </QueryClientProvider>
    );

    const result = renderHook(callback, { ...options, wrapper });

    // testing-library/react@16 sets `result.current` inside a useEffect; under
    // happy-dom + React 19 this may not be flushed before the renderHook call
    // returns when there is leftover React work from a previous test in the
    // same module. Force a re-render so the effect runs before the test
    // accesses `result.current`.
    if (result.result.current === null) {
        result.rerender(undefined as unknown as TProps);
    }

    return Object.assign(result, { queryClient });
}
