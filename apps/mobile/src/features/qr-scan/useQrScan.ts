import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useQrResult, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

interface IProps {
    onSuccess: (address: string) => void;
    onError?: () => void;
}

export function useQrScan({ onSuccess, onError }: IProps) {
    const toast = useToast();
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();

    const defaultOnError = useCallback(() => {
        toast({ message: t('scan.errors.invalidAddress'), type: 'error' });
    }, [toast, t]);

    const handleResult = useQrResult({
        onSuccess,
        onError: onError ?? defaultOnError
    });

    return useCallback(() => {
        navigation.navigate('QRScanModal', {
            onSuccess: handleResult,
            onClose: () => {},
            title: t('home.actions.scan')
        });
    }, [navigation, handleResult, t]);
}
