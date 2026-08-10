import { useMutation } from '@tanstack/react-query';

import { useActiveAccountSyncStorageUpdate } from '../account/useAccountSyncStorageUpdate';

export function useDevSetDeviceLastSyncAt() {
    const update = useActiveAccountSyncStorageUpdate();

    return useMutation<void, Error, { ikPubHex: string; lastSyncAt: number }>({
        async mutationFn({ ikPubHex, lastSyncAt }) {
            await update(draft => {
                const syncState = draft.at('devicesSyncState');
                const stored = syncState.get(ikPubHex);

                syncState.entry(ikPubHex).set({
                    lastSyncAt,
                    portfolioIds: stored?.portfolioIds ?? {}
                });

                draft.at('devicesMeta').ifPresent(devicesMeta =>
                    devicesMeta.entry(ikPubHex).update(device => {
                        device.at('pairedAt').set(lastSyncAt);
                    })
                );
            });
        }
    });
}
