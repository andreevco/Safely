import { useCurrentDeviceIkPub, useSyncedDevicesMeta } from '@safely/ux';

export type AccountSyncState = 'noDevices' | 'fullCopy' | 'partialCopy';

export function useAccountSyncState(): AccountSyncState {
    const devicesMeta = useSyncedDevicesMeta();
    const myIkPubHex = useCurrentDeviceIkPub();

    const otherDevices = Object.entries(devicesMeta ?? {}).filter(
        ([ikPubHex]) => ikPubHex !== myIkPubHex
    );

    if (otherDevices.length === 0) {
        return 'noDevices';
    }

    return 'fullCopy';
}
