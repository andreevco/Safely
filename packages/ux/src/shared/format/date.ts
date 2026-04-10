import { useMemo } from 'react';

import { NBSP } from '@safely/core';

import { useAppContext } from '../providers';

export function useDateFormatter(options?: Intl.DateTimeFormatOptions) {
    const {
        i18n: { language }
    } = useAppContext();

    return useMemo(() => {
        const createFormatCallback = (formatter: Intl.DateTimeFormat) => (date?: Date | number) => {
            let formatted = formatter.format(date);

            if (language.startsWith('en')) {
                formatted = formatted.replace(' at ', ', ');
            }

            return formatted;
        };

        const formatterCallback = (rewriteOpts: Intl.DateTimeFormatOptions) => {
            return {
                format: createFormatCallback(
                    new Intl.DateTimeFormat(language, { ...options, ...rewriteOpts })
                )
            };
        };

        formatterCallback.format = createFormatCallback(new Intl.DateTimeFormat(language, options));

        return formatterCallback;
    }, [language, options]);
}

export function useRelativeTime(timestampMs: number | null): string | null {
    const { i18n } = useAppContext();

    return useMemo(() => {
        if (timestampMs === null) {
            return null;
        }

        const diffMs = Date.now() - timestampMs;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        const rtf = new Intl.RelativeTimeFormat(i18n.language, {
            numeric: 'always',
            style: 'long'
        });

        const withNbsp = (s: string) => s.replace(/(\d)\s+/g, `$1${NBSP}`);

        if (diffDays > 0) {
            return withNbsp(rtf.format(-diffDays, 'day'));
        }
        if (diffHours > 0) {
            return withNbsp(rtf.format(-diffHours, 'hour'));
        }
        if (diffMinutes > 0) {
            return withNbsp(rtf.format(-diffMinutes, 'minute'));
        }
        return withNbsp(rtf.format(-1, 'minute'));
    }, [timestampMs, i18n.language]);
}

export type DateFormatter = ReturnType<typeof useDateFormatter>;
