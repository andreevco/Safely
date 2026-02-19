import { useCallback } from 'react';

import { ExternalInputSchemeName, SchemeByName } from '@safely/core';

import { useExternalInputParser } from './useExternalInputParser';
import { useAppSdk } from '../../shared';

interface UseScanQrSchemeOptions<SName extends ExternalInputSchemeName = ExternalInputSchemeName> {
    onResult: (scheme: SchemeByName<SName>) => void;
    allowedSchemes?: readonly SName[];
    scannerOptions?: { titleTranslationKey?: string; subTranslationKey?: string };
}

export function useScanQrScheme<SName extends ExternalInputSchemeName = ExternalInputSchemeName>(
    options: UseScanQrSchemeOptions<SName>
): () => void {
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
