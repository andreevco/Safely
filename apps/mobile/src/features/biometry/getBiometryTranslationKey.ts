import { Platform } from 'react-native';

import { BiometryType } from './useBiometry';

export function getBiometryTranslationKey(type: BiometryType): string {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    if (type === BiometryType.FACE) {
        return `biometry.face.${platform}`;
    }

    return `biometry.fingerprint.${platform}`;
}
