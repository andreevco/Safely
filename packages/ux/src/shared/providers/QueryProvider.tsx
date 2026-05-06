import { QueryCache, QueryClient } from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { FC, PropsWithChildren, ReactNode } from 'react';
import React, { Suspense, useEffect, useState } from 'react';

import type { Logger } from '@safely/sync';

import { QueryHydrationProvider } from '../contexts';
import { QUERIES_STALE_TIME, BUSTER_VERSION, CACHE_LIVE_TIME } from '../query-core';

export function createQueryClient(logger: Logger): QueryClient {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: (error, query) => {
                logger.error('[QueryClient] query error', error, 'in', query.queryKey);
            }
        }),
        defaultOptions: {
            queries: {
                gcTime: CACHE_LIVE_TIME,
                staleTime: QUERIES_STALE_TIME.DEFAULT,
                experimental_prefetchInRender: true
            }
        }
    });
}

export const QueryProvider: FC<
    PropsWithChildren<{
        loader?: ReactNode;
        persister: Persister;
        queryClient: QueryClient;
    }>
> = ({ children, loader, persister, queryClient }) => {
    const [hydratedAt, setHydratedAt] = useState<number | null>(null);
    const isReady = hydratedAt !== null;

    useEffect(() => {
        if (!isReady) return;

        void queryClient.invalidateQueries({
            predicate: q => Boolean(q.meta?.persist)
        });
    }, [isReady, queryClient]);

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: CACHE_LIVE_TIME,
                buster: BUSTER_VERSION,
                dehydrateOptions: {
                    shouldDehydrateQuery: query => {
                        if (!query.options.meta?.persist) {
                            return false;
                        }

                        return query.state.status === 'success' || query.state.dataUpdatedAt > 0;
                    }
                }
            }}
            onError={() => setHydratedAt(Date.now())}
            onSuccess={() => setHydratedAt(Date.now())}
        >
            <QueryHydrationProvider value={{ hydratedAt }}>
                {isReady ? (
                    <Suspense fallback={loader ?? null}>{children}</Suspense>
                ) : (
                    (loader ?? null)
                )}
            </QueryHydrationProvider>
        </PersistQueryClientProvider>
    );
};
