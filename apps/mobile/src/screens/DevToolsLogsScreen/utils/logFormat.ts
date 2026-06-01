import { LogLevel } from '@safely/sync';

import type { TextProps } from '@mobile/shared/ui';

export const scopeLabel = (path: string[]): string =>
    path.length > 0 ? path.join(' › ') : '(root)';

export const formatMessage = (message: string): string => {
    const trimmed = message.trim();
    const start = trimmed.search(/[{[]/);

    if (start !== -1) {
        try {
            const pretty = JSON.stringify(JSON.parse(trimmed.slice(start)), null, 2);
            const prefix = trimmed.slice(0, start).trim();

            return prefix ? `${prefix}\n${pretty}` : pretty;
        } catch {
            return message;
        }
    }

    return message;
};

export const levelColor = (level: LogLevel): TextProps['color'] => {
    if (level >= LogLevel.ERROR) return 'accentRed';
    if (level >= LogLevel.WARN) return 'accentOrange';
    if (level >= LogLevel.INFO) return 'primary';

    return 'tertiary';
};
