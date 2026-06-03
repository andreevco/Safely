import { useQuery } from '@tanstack/react-query';

import { readLogs } from '@mobile/shared/logger';

import { devToolsLogsKeys } from './keys';

export const useLogs = () =>
    useQuery({
        queryKey: devToolsLogsKeys.records.toKey(),
        queryFn: readLogs,
        staleTime: 0,
        gcTime: 0
    });
