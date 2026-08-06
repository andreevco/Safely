import type { UserCountryInfo } from '@safely/core';

import { apiKeys } from './keys';
import { useAppContext } from '../providers';
import { useSuspenseQuery } from '../query-core';

export function useUserCountryInfo(): UserCountryInfo {
    const { getUserCountryInfo } = useAppContext();

    return useSuspenseQuery<UserCountryInfo>({
        queryKey: apiKeys.userCountryInfo().toKey(),
        queryFn: () => getUserCountryInfo(),
        staleTime: Infinity
    }).data;
}
