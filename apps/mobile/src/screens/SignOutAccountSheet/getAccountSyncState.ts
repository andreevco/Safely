import { DeviceMeta } from '@safely/ux/shared/storage/account/synced/schemas';

export type AccountSyncState = 'noDevices' | 'fullCopy' | 'partialCopy';

export function getAccountSyncState(
    devicesMeta: Record<string, DeviceMeta> | null,
    myIkPubHex: string
): AccountSyncState {
    const otherDevices = Object.entries(devicesMeta ?? {}).filter(
        ([ikPubHex]) => ikPubHex !== myIkPubHex
    );

    if (otherDevices.length === 0) {
        return 'noDevices';
    }

    const currentSyncState = devicesMeta?.[myIkPubHex]?.syncState;

    const hasFullCopy = otherDevices.some(
        ([, meta]) => meta.syncState.stateHash === currentSyncState?.stateHash
    );

    return hasFullCopy ? 'fullCopy' : 'partialCopy';
}
