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
        (
            url: string,
            {
                allowedProtocols,
                preferInApp
            }: { allowedProtocols?: LinkingProtocol[]; preferInApp?: boolean } = {}
        ) => {
            linking.openURL(url, { allowedProtocols, preferInApp }).catch(errorToast);
        },
        [linking, errorToast]
    );

    return { openURL };
}
