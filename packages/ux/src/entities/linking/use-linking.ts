import { useCallback } from 'react';

import { useAppContext } from '../../shared';
import { useErrorToast } from '../errors';
import { useLogger } from '../logger';

export function useLinking() {
    const logger = useLogger();
    const { linking } = useAppContext();
    const errorToast = useErrorToast({
        LinkingUnsafeProtocolError: 'linking.errors.unsafeProtocol',
        LinkingFailedToOpenError: 'linking.errors.failedToOpen'
    });

    const openURL = useCallback(
        (url: string) => {
            linking.openURL(url, logger).catch(errorToast);
        },
        [linking, errorToast, logger]
    );

    return { openURL };
}
