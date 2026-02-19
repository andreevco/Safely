import { useCallback } from 'react';

import { parseExternalInput, ExternalInputResult, ExternalInputSchemeName } from '@safely/core';

import { useToast } from '../../entities';
import { useTranslate } from '../../shared';

interface UseExternalInputParserOptions {
    allowedSchemes?: readonly ExternalInputSchemeName[];
    showErrorToast?: boolean;
}

type ReturnType = (raw: string) => ExternalInputResult;

export function useExternalInputParser(options?: UseExternalInputParserOptions): ReturnType {
    const { allowedSchemes, showErrorToast = true } = options ?? {};

    const t = useTranslate();
    const toast = useToast();

    return useCallback(
        (raw: string) => {
            const result = parseExternalInput(raw, allowedSchemes);

            if (!result.ok && showErrorToast) {
                toast({
                    message: t(result.error),
                    type: 'error'
                });
            }

            return result;
        },
        [allowedSchemes, showErrorToast, toast, t]
    );
}
