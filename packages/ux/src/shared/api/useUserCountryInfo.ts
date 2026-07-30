import type { UserCountryInfo } from '@safely/core';

import { apiKeys } from './keys';
import { useAppContext } from '../providers';
import { QUERIES_STALE_TIME, usePersistSuspenseQuery } from '../query-core';

export function useUserCountryInfo(): UserCountryInfo {
    const { getUserCountryInfo } = useAppContext();

    return usePersistSuspenseQuery<UserCountryInfo>({
        queryKey: apiKeys.userCountryInfo().toKey(),
        queryFn: () => getUserCountryInfo(),
        staleTime: query => (query.state.data?.storeCode === null ? 0 : QUERIES_STALE_TIME.DEFAULT),
        schemaKey: 'userCountryInfo'
    }).data;
}
