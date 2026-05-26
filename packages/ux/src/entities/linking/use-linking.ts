import { useCallback } from 'react';

import { useAppContext } from '../../shared';
import type { LinkingProtocol } from '../../shared/linking';
import { useErrorToast } from '../errors';

export function useLinking() {
    const { linking } = useAppContext();
    const errorToast = useErrorToast({
        LinkingUnsafeProtocolError: 'linking.errors.unsafeProtocol',
        LinkingFailedToOpenError: 'linking.errors.failedToOpen'
    });

    const openURL = useCallback(
        (url: string, allowedProtocols?: LinkingProtocol[]) => {
            linking.openURL(url, allowedProtocols).catch(errorToast);
        },
        [linking, errorToast]
    );

    return { openURL };
}
