import { keepPreviousData } from '@tanstack/react-query';

import type { BootConfig } from '@safely/core';

import { apiKeys } from './keys';
import { useConfigApi } from './useConfigApi';
import { usePersistSuspenseQuery } from '../query-core';

export function useBootConfigQuery() {
    const configApi = useConfigApi();

    return usePersistSuspenseQuery<BootConfig>({
        queryKey: apiKeys.bootConfig(configApi.id).toKey(),
        queryFn: () => configApi.boot(),
        schemaKey: 'bootConfig',
        placeholderData: keepPreviousData
    });
}

export function useBootConfig() {
    return useBootConfigQuery().data;
}
