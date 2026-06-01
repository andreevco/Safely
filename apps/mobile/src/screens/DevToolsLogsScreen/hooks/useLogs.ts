import { useCallback, useEffect, useRef, useState } from 'react';

import { readLogs, type LogRecord } from '@mobile/shared/logger';

export const useLogs = () => {
    const isMountedRef = useRef(true);
    const [records, setRecords] = useState<LogRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const reload = useCallback(() => {
        setIsLoading(true);
        readLogs()
            .then(result => {
                if (isMountedRef.current) {
                    setRecords(result);
                }
            })
            .finally(() => {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            });
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        reload();

        return () => {
            isMountedRef.current = false;
        };
    }, [reload]);

    return {
        records,
        isLoading,
        reload
    };
};
