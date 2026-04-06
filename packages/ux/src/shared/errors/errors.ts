import { useCallback, useMemo } from 'react';

import { getErrorText, TranslatableErrorsConfig } from '@safely/core';

import { useToast } from '../../entities';
import { useTranslate } from '../i18n';

export interface ParseErrorOptions {
    fallback?: string;
}

export function useParseError(config: TranslatableErrorsConfig, options?: ParseErrorOptions) {
    const t = useTranslate();

    const translatedConfig = useMemo(() => {
        return {
            UnknownError: () => t(options?.fallback ?? 'common.errors.unknown'),
            ...Object.fromEntries(
                Object.entries(config).map(([k, v]) => {
                    if (typeof v === 'string') {
                        return [k, () => t(v)];
                    } else {
                        return [k, v];
                    }
                })
            )
        };
    }, [config, t, options?.fallback]);

    return useCallback(
        (error: unknown) => getErrorText(error, translatedConfig),
        [translatedConfig, options]
    );
}

export function useParsedError(
    error: unknown,
    config: TranslatableErrorsConfig,
    options?: ParseErrorOptions
) {
    const parseError = useParseError(config, options);
    return useMemo(() => parseError(error), [parseError, error]);
}

export function useErrorToast(config: TranslatableErrorsConfig, options?: ParseErrorOptions) {
    const toast = useToast();
    const parseError = useParseError(config, options);

    return useCallback(
        (e: unknown) => {
            console.error(e);
            toast({ message: parseError(e), type: 'error' });
        },
        [toast, parseError]
    );
}
