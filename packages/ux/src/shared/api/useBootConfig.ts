import { keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { BootApi } from '@safely/core';
import type { BootConfig } from '@safely/core';

import { apiKeys } from './keys';
import { useAppContext } from '../providers';
import { usePersistSuspenseQuery } from '../query-core';

export function useBootApi(): BootApi {
    const { version, build, i18n, userCountryInfo } = useAppContext();

    return useMemo(
        () =>
            new BootApi({
                build,
                version,
                lang: i18n.language,
                userCountryInfo
            }),
        [build, version, i18n.language, userCountryInfo]
    );
}

export function useBootConfigQuery() {
    const bootApi = useBootApi();

    return usePersistSuspenseQuery<BootConfig>({
        queryKey: apiKeys.bootConfig(bootApi.id).toKey(),
        queryFn: () => bootApi.boot(),
        schemaKey: 'bootConfig',
        placeholderData: keepPreviousData
    });
}

export function useBootConfig() {
    return useBootConfigQuery().data;
}
