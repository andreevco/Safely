import { Platform } from 'react-native';

import type { IconProps } from '@mobile/shared/ui/Icon';
import { FaceidAndroid96, FaceidIos96, Fingerprint96 } from '@mobile/shared/ui/Icon';

import { BiometryType } from './useBiometry';

export function getBiometryIcon(type: BiometryType | null | undefined): IconProps['icon'] {
    switch (type) {
        case BiometryType.FACE:
            return Platform.OS === 'ios' ? FaceidIos96 : FaceidAndroid96;
        case BiometryType.IRIS:
            return FaceidAndroid96;
        case BiometryType.FINGERPRINT:
        default:
            return Fingerprint96;
    }
}
