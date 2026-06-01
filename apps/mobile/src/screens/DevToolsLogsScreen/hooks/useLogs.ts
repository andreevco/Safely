import { useCallback, useEffect, useState } from 'react';

import { readLogs, type LogRecord } from '@mobile/shared/logger';

export const useLogs = () => {
    const [records, setRecords] = useState<LogRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const reload = useCallback(() => {
        setIsLoading(true);
        readLogs()
            .then(setRecords)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(reload, [reload]);

    return {
        records,
        isLoading,
        reload
    };
};
