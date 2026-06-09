import type { DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { rnBleTransportIdentifier } from '@ledgerhq/device-transport-kit-react-native-ble';
import { useEffect, useState } from 'react';

import { useLedgerSession } from './LedgerSigningProvider';

export type DiscoveryStatus = 'searching' | 'found';

export const useLedgerDeviceScan = () => {
    const { getDmk } = useLedgerSession();
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        const subscription = getDmk()
            .listenToAvailableDevices({ transport: rnBleTransportIdentifier })
            .subscribe({
                next: setDevices,
                error: () => {}
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [getDmk]);

    const status: DiscoveryStatus = devices.length > 0 ? 'found' : 'searching';

    return { devices, status };
};
