import { useCallback } from 'react';

import { useAppContext } from '../../shared';
import { useErrorToast } from '../errors';

export function useLinking() {
    const { linking } = useAppContext();
    const errorToast = useErrorToast({
        LinkingUnsafeProtocolError: 'linking.errors.unsafeProtocol',
        LinkingFailedToOpenError: 'linking.errors.failedToOpen'
    });

    const openURL = useCallback(
        (url: string) => {
            linking.openURL(url).catch(errorToast);
        },
        [linking, errorToast]
    );

    return { openURL };
}
