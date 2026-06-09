import { useMemo } from 'react';

import type { Logger } from '@safely/sync';

import { useAppContext } from '../providers/AppContext';

export function useLogger(childLabel?: string): Logger {
    const { logger } = useAppContext();

    return useMemo(
        () => (childLabel === undefined ? logger : logger.child(childLabel)),
        [logger, childLabel]
    );
}
