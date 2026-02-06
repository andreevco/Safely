import { mmkvStorage } from '@mobile/shared/storage/mmkv';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

const BIOMETRY_ENABLED_KEY = 'biometry_enabled';

export enum BiometryType {
    FACE = 'face',
    FINGERPRINT = 'fingerprint',
    IRIS = 'iris'
}

export type UseBiometryResultSupported =
    | {
          availableType: BiometryType;
          isEnabled: true;
          setEnabled: (value: boolean) => Promise<void>;
          authenticate: () => Promise<{ success: true } | { success: false; error: string }>;
      }
    | {
          availableType: BiometryType;
          isEnabled: false;
          setEnabled: (value: boolean) => Promise<void>;
          authenticate?: undefined;
      };

export type UseBiometryResultNotSupported = {
    availableType: null;
    isEnabled: false;
    setEnabled?: undefined;
    authenticate?: undefined;
};

export type UseBiometryResult =
    | (UseBiometryResultSupported & { isLoading: false })
    | (UseBiometryResultNotSupported & { isLoading: false })
    | {
          isLoading: true;
          availableType: null;
          isEnabled: false;
          setEnabled?: undefined;
          authenticate?: undefined;
      };

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

function getStoredEnabled(): boolean {
    const raw = mmkvStorage.getItem(BIOMETRY_ENABLED_KEY);
    if (raw === null) return false;
    try {
        return JSON.parse(raw) === true;
    } catch {
        return false;
    }
}

export function useBiometry(): UseBiometryResult {
    const [isLoading, setIsLoading] = useState(true);
    const [availableType, setAvailableType] = useState<BiometryType | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getAvailableBiometryType().then(type => {
            if (cancelled) return;
            setAvailableType(type);
            if (type !== null) {
                setIsEnabled(getStoredEnabled());
            }
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const authenticate = useCallback(async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync();
            if (result.success) {
                return { success: true } as const;
            } else {
                return { success: false, error: result.error } as const;
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            } as const;
        }
    }, []);

    const setEnabledValue = useCallback(async (enabled: boolean) => {
        const result = await LocalAuthentication.authenticateAsync();
        if (result.success) {
            mmkvStorage.setItem(BIOMETRY_ENABLED_KEY, JSON.stringify(enabled));
            setIsEnabled(enabled);
        }
    }, []);

    if (isLoading) {
        return { isLoading: true, availableType: null, isEnabled: false };
    }

    if (availableType === null) {
        return { isLoading: false, availableType: null, isEnabled: false };
    }

    if (!isEnabled) {
        return {
            isLoading: false,
            availableType,
            isEnabled: false,
            setEnabled: setEnabledValue
        };
    }

    return {
        isLoading: false,
        availableType,
        isEnabled: true,
        setEnabled: setEnabledValue,
        authenticate
    };
}
