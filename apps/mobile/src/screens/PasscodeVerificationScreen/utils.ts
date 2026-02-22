import { TFunction } from 'i18next';

export function formatLockoutTime(remainingMs: number, t: TFunction) {
    const minutes = Math.ceil(remainingMs / 60_000);

    if (minutes >= 60) {
        const hours = Math.ceil(remainingMs / (60 * 60_000));
        return t('passcode.lockout.subtitleHours', { count: hours });
    }

    return t('passcode.lockout.subtitleMinutes', { count: minutes });
}
