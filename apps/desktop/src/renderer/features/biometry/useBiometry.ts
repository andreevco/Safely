import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { biometryKeys } from './keys';
import { i18n } from '../../i18n';
import { platform } from '../../platform';
import { desktopLayerRegularStorage, useDesktopLayerRegularStorage } from '../../shared';

export function authenticateBiometry(): Promise<boolean> {
    return platform.biometry.authenticate(i18n.t('biometry.reason'));
}

/* the security gate runs outside React, so this path takes the storage without the hook */
export async function isBiometryUnlockEnabled(): Promise<boolean> {
    const [isAvailable, isEnabled] = await Promise.all([
        platform.biometry.isAvailable(),
        desktopLayerRegularStorage.get('biometryEnabled')
    ]);

    return isAvailable && isEnabled === true;
}

/* deliberately not suspending: an availability round-trip must not blank the app it renders inside */
export function useBiometryQuery() {
    const { get: storageGet } = useDesktopLayerRegularStorage('biometryEnabled');

    return useQuery({
        queryKey: biometryKeys.state.toKey(),
        queryFn: async () => {
            const isAvailable = await platform.biometry.isAvailable();

            return {
                isAvailable,
                isEnabled: isAvailable && (await storageGet()) === true
            };
        },
        staleTime: Infinity
    });
}

export function useSetBiometryEnabled() {
    const client = useQueryClient();
    const { set: storageSet } = useDesktopLayerRegularStorage('biometryEnabled');

    return useMutation({
        /* proving the factor works is part of turning it on, and of giving it up */
        mutationFn: async (enabled: boolean) => {
            if (!(await authenticateBiometry())) {
                throw new Error('Biometric authentication failed');
            }

            await storageSet(enabled);
        },
        onSuccess: () => client.invalidateQueries({ queryKey: biometryKeys.state.toKey() })
    });
}
