import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useRelativeTime(timestampMs: number | null): string | null {
    const { i18n } = useTranslation();

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

        const withNbsp = (s: string) => s.replace(/(\d)\s+/g, '$1\u00A0');

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
