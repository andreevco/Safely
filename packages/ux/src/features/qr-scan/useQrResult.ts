import { useCallback } from 'react';

import { BtcAddress } from '@safely/core';

import { useToast } from '../../entities';
import { useTranslate } from '../../shared';

export function parseQrValue(raw: string): string {
    const btcPrefix = 'bitcoin:';

    if (raw.toLowerCase().startsWith(btcPrefix)) {
        const withoutPrefix = raw.slice(btcPrefix.length);
        return withoutPrefix.split('?')[0];
    }

    return raw;
}

interface IProps {
    onSuccess: (address: string) => void;
    onError?: () => void;
}

export function useQrResult(props: IProps) {
    const { onSuccess, onError } = props;

    const toast = useToast();
    const t = useTranslate();

    const defaultOnError = useCallback(() => {
        toast({
            message: t('scan.errors.invalidAddress'),
            type: 'error'
        });
    }, [toast, t]);

    const errorHandler = onError ?? defaultOnError;

    return useCallback(
        (scannedValue: string) => {
            const address = parseQrValue(scannedValue);

            if (BtcAddress.validate(address)) {
                onSuccess(address);
            } else {
                errorHandler();
            }
        },
        [onSuccess, errorHandler]
    );
}
