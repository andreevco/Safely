import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useQrResult, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

interface ScanModalHeaderData {
    title: string;
    subtitle: string;
}

interface IProps {
    onSuccess: (address: string) => void;
    onError?: () => void;
    headerData?: ScanModalHeaderData;
}

export function useQrScan(props: IProps) {
    const { onSuccess, onError, headerData } = props;

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

    const title = headerData?.title ?? t('qrScan.title');
    const subtitle = headerData?.subtitle ?? t('qrScan.subtitle');

    return useCallback(() => {
        navigation.navigate('QRScanModal', {
            onSuccess: handleResult,
            onClose: () => {},
            title,
            subtitle
        });
    }, [navigation, handleResult, title, subtitle]);
}
