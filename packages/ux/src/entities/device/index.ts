import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    type DeviceMeta,
    useAppContext,
    useSuspenseQuery,
    useActiveAccountSyncedStorage
} from '../../shared';
import { useActiveAccount, useActiveAccountQueryKey } from '../account';

export function useDevicesMetaQuery() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('devicesMeta');

    return useSuspenseQuery({
        queryKey: accountQueryKey.devicesMeta.toKey(),
        queryFn: get,
        staleTime: Infinity
    });
}

export function useDevicesMeta(): Record<string, DeviceMeta> | null {
    return useDevicesMetaQuery().data;
}

export function useMyDeviceIkPub() {
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();

    return useSuspenseQuery({
        queryKey: [...accountQueryKey.devicesMeta.toKey(), 'myIkPub'],
        queryFn: async () => {
            const ikPub = await account.getMyDeviceIkPub();
            return ikPub.toString('hex');
        },
        staleTime: Infinity
    }).data;
}

export function useRevokeDevice() {
    const client = useQueryClient();
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();
    const { get, set } = useActiveAccountSyncedStorage('devicesMeta');

    return useMutation({
        async mutationFn(ikPubHex: string) {
            await account.revokeRemoteDevice(Buffer.from(ikPubHex, 'hex'));

            const existing = (await get()) ?? {};
            const { [ikPubHex]: _, ...rest } = existing;
            await set(Object.keys(rest).length > 0 ? rest : null);

            await client.invalidateQueries({ queryKey: accountQueryKey.devicesMeta.toKey() });
        }
    });
}

export function useReportDeviceMeta() {
    const client = useQueryClient();
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();
    const { version, build, deviceInfo } = useAppContext();
    const { get, set } = useActiveAccountSyncedStorage('devicesMeta');

    return useMutation({
        async mutationFn() {
            const ikPub = await account.getMyDeviceIkPub();
            const ikPubHex = ikPub.toString('hex');
            const existing = (await get()) ?? {};

            const myMeta: DeviceMeta = {
                name: deviceInfo.name,
                platform: build as 'ios' | 'android',
                osVersion: deviceInfo.osVersion,
                appVersion: version,
                lastSyncedAt: Date.now()
            };

            await set({ ...existing, [ikPubHex]: myMeta });
            await client.invalidateQueries({ queryKey: accountQueryKey.devicesMeta.toKey() });
        }
    });
}
