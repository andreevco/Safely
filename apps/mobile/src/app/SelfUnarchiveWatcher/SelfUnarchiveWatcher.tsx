import { useEffect, useRef } from 'react';

import {
    useCurrentDeviceIkPub,
    useHasAccount,
    useSyncedDeviceDetails,
    useUnarchiveDevice
} from '@safely/ux';

import { navigationRef } from '../navigation/navigationRef';

const SelfUnarchiveWatcherInner = () => {
    const currentIkPubHex = useCurrentDeviceIkPub();
    const { mutateAsync: unarchiveDevice } = useUnarchiveDevice();
    const details = useSyncedDeviceDetails(currentIkPubHex);
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
            .finally(() => {
                isHandlingRef.current = false;
            });
    }, [archive, currentIkPubHex, unarchiveDevice]);

    return null;
};

export const SelfUnarchiveWatcher = () => {
    const hasAccount = useHasAccount();

    return hasAccount ? <SelfUnarchiveWatcherInner /> : null;
};
