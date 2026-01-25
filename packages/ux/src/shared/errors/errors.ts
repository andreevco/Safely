import { useCallback, useMemo } from 'react';

import { useToast } from '../../entities';
import { useTranslate } from '../i18n';

export type TranslatableErrorsConfig = Record<string, string | (() => string)>;

export interface ParseErrorOptions {
    fallback?: string;
}

function getErrorName(error: unknown): string | null {
    if (error instanceof Error && error.name) {
        return error.name;
    }
    return null;
}

function getErrorText(
    error: unknown,
    config: Record<string, () => string>,
    options?: ParseErrorOptions
): string {
    const errorName = getErrorName(error);

    if (errorName && config[errorName]) {
        return config[errorName]();
    }

    if (config.UnknownError) {
        return config.UnknownError();
    }

    return options?.fallback ?? 'Unknown error';
}

export function useParseError(config: TranslatableErrorsConfig, options?: ParseErrorOptions) {
    const t = useTranslate();

    const translatedConfig = useMemo(() => {
        return {
            UnknownError: () => t('common.errors.unknown'),
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
    }, [config, t]);

    return useCallback(
        (error: unknown) => getErrorText(error, translatedConfig, options),
        [translatedConfig, options]
    );
}

export function useErrorToast(config: TranslatableErrorsConfig, options?: ParseErrorOptions) {
    const toast = useToast();
    const parseError = useParseError(config, options);

    return useCallback(
        (e: unknown) => {
            toast({ message: parseError(e), type: 'error' });
        },
        [toast, parseError]
    );
}
