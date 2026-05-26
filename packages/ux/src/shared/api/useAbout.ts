import { keepPreviousData } from '@tanstack/react-query';

import type { About } from '@safely/core';

import { apiKeys } from './keys';
import { useConfigApi } from './useConfigApi';
import { usePersistQuery } from '../query-core';

export function useAboutQuery() {
    const configApi = useConfigApi();

    return usePersistQuery<About>({
        queryKey: apiKeys.about(configApi.id).toKey(),
        queryFn: () => configApi.getAbout(),
        schemaKey: 'about',
        placeholderData: keepPreviousData
    });
}
