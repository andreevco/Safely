import { useQueryClient } from '@tanstack/react-query';

import { useActiveAccountQueryKey } from '@safely/ux';
import type { DeviceMeta } from '@safely/ux/shared/storage/account/synced/schemas';

export type AccountSyncState = 'noDevices' | 'fullCopy' | 'partialCopy';

type DevicesMetaMap = Record<string, DeviceMeta> | null;

export function useAccountSyncState(): AccountSyncState {
    const queryClient = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();

    const devicesMeta =
        queryClient.getQueryData<DevicesMetaMap>(accountQueryKey.devices.meta.toKey()) ?? null;
    const myIkPubHex =
        queryClient.getQueryData<string>(accountQueryKey.devices.currentIkPub.toKey()) ?? '';

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
