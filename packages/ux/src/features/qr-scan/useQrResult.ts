import { useCallback } from 'react';

import { BtcAddress } from '@safely/core';

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
    onError: () => void;
}

export function useQrResult({ onSuccess, onError }: IProps) {
    return useCallback(
        (scannedValue: string) => {
            const address = parseQrValue(scannedValue);

            if (BtcAddress.validate(address)) {
                onSuccess(address);
            } else {
                onError();
            }
        },
        [onSuccess, onError]
    );
}
