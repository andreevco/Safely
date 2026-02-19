import { useCallback } from 'react';

import {
    parseExternalInput,
    ExternalInputResult,
    ExternalInputSchemeName,
    SchemeByName
} from '@safely/core';

import { useToast } from '../../entities';
import { useTranslate } from '../../shared';

interface UseExternalInputParserOptions<
    SName extends ExternalInputSchemeName = ExternalInputSchemeName
> {
    allowedSchemes?: readonly SName[];
    showErrorToast?: boolean;
}

export function useExternalInputParser<
    SName extends ExternalInputSchemeName = ExternalInputSchemeName
>(
    options?: UseExternalInputParserOptions<SName>
): (raw: string) => ExternalInputResult<SchemeByName<SName>> {
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

            return result as ExternalInputResult<SchemeByName<SName>>;
        },
        [allowedSchemes, showErrorToast, toast, t]
    );
}
