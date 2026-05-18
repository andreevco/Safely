import { useQueryClient } from '@tanstack/react-query';

import type { SDeviceMeta } from '@safely/sync-storage';
import { useActiveAccountQueryKey } from '@safely/ux';

export type AccountSyncState = 'noDevices' | 'fullCopy' | 'partialCopy';

type DevicesMetaMap = Record<string, SDeviceMeta> | null;

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

    return 'fullCopy';
}
