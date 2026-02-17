import { useCallback } from 'react';

import { ExternalInputScheme, ExternalInputSchemeName } from './schemes';
import { useExternalInputParser } from './useExternalInputParser';
import { useAppSdk } from '../../shared';

interface UseQrScanOptions {
    onResult: (scheme: ExternalInputScheme) => void;
    allowedSchemes?: readonly ExternalInputSchemeName[];
    scannerOptions?: { titleTranslationKey?: string; subTranslationKey?: string };
}

export function useQrScan(options: UseQrScanOptions): () => void {
    const { onResult, allowedSchemes, scannerOptions } = options;

    const sdk = useAppSdk();
    const parse = useExternalInputParser({ allowedSchemes });

    return useCallback(() => {
        sdk.qrScanner.scan(scannerOptions).then(raw => {
            const result = parse(raw);

            if (result.ok) {
                onResult(result.scheme);
            }
        });
    }, [sdk.qrScanner, scannerOptions, parse, onResult]);
}
