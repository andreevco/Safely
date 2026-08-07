import { useEffect, useRef } from 'react';

import {
    useCurrentDeviceIkPub,
    useHasAccount,
    useLogger,
    useSyncedDeviceDetails,
    useUnarchiveDevice
} from '@safely/ux';

import { navigationRef } from '../navigation/navigationRef';

const SelfUnarchiveWatcherInner = () => {
    const currentIkPubHex = useCurrentDeviceIkPub();
    const { mutateAsync: unarchiveDevice } = useUnarchiveDevice();
    const details = useSyncedDeviceDetails(currentIkPubHex);
    const logger = useLogger('self-unarchive');
    const isHandlingRef = useRef(false);

    const archive = details?.archive ?? null;

    useEffect(() => {
        if (archive === null || isHandlingRef.current) {
            return;
        }

        isHandlingRef.current = true;

        unarchiveDevice(currentIkPubHex)
            .then(() =>
                navigationRef.navigate('DeviceUnarchivedSheet', {
                    archivedFromDeviceName: archive.archivedFromDeviceName
                })
            )
            .catch(e => logger.error('self_unarchive.failed', e))
            .finally(() => {
                isHandlingRef.current = false;
            });
    }, [archive, currentIkPubHex, unarchiveDevice, logger]);

    return null;
};

export const SelfUnarchiveWatcher = () => {
    const hasAccount = useHasAccount();

    return hasAccount ? <SelfUnarchiveWatcherInner /> : null;
};
