import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import z from 'zod';

import { useMutation, useSharedUnstructuredStorage } from '@safely/ux';

import { StorageKey } from '@mobile/shared/constants';

import { biometryKeys } from './keys';

const sBiometryEnabled = z.boolean();

export enum BiometryType {
    FACE = 'face',
    FINGERPRINT = 'fingerprint',
    IRIS = 'iris'
}

function resolveType(types: LocalAuthentication.AuthenticationType[]): BiometryType | null {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
        return BiometryType.FACE;
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
        return BiometryType.FINGERPRINT;
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return BiometryType.IRIS;
    return null;
}

async function getAvailableBiometryType(): Promise<BiometryType | null> {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync()
    ]);
    const type = resolveType(supportedTypes);

    if (type !== null && hasHardware && isEnrolled) {
        return type;
    } else {
        return null;
    }
}

export function useBiometryQuery() {
    const { get: storageGet } = useSharedUnstructuredStorage(
        StorageKey.BIOMETRY_ENABLED,
        sBiometryEnabled
    );

    return useQuery({
        queryKey: biometryKeys.state.toKey(),
        queryFn: async () => {
            const availableType = await getAvailableBiometryType();
            const isEnabled = availableType !== null ? Boolean(await storageGet()) : false;
            return { availableType, isEnabled };
        },
        staleTime: Infinity
    });
}

export function useSetBiometryEnabled() {
    const queryClient = useQueryClient();
    const { set: storageSet } = useSharedUnstructuredStorage(
        StorageKey.BIOMETRY_ENABLED,
        sBiometryEnabled
    );

    return useMutation({
        mutationFn: async (enabled: boolean) => {
            const result = await LocalAuthentication.authenticateAsync();
            if (!result.success) {
                throw new Error('Authentication failed');
            }
            await storageSet(enabled);
        },
        async onSuccess() {
            await queryClient.invalidateQueries({ queryKey: biometryKeys.state.toKey() });
        }
    });
}

export async function authenticateBiometry() {
    try {
        const result = await LocalAuthentication.authenticateAsync();
        if (result.success) {
            return { success: true } as const;
        }
        return { success: false, error: result.error } as const;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        } as const;
    }
}
