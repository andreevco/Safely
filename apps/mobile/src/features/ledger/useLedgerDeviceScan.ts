import type { DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { rnBleTransportIdentifier } from '@ledgerhq/device-transport-kit-react-native-ble';
import { useEffect, useState } from 'react';

import { useLedgerSession } from './LedgerSigningProvider';

export type DiscoveryStatus = 'searching' | 'found';

export const useLedgerDeviceScan = () => {
    const { getLedgerKit } = useLedgerSession();
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

    useEffect(() => {
        const subscription = getLedgerKit()
            .listenToAvailableDevices({ transport: rnBleTransportIdentifier })
            .subscribe({
                next: setDevices,
                error: () => {}
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [getLedgerKit]);

    const status: DiscoveryStatus = devices.length > 0 ? 'found' : 'searching';

    return { devices, status };
};
