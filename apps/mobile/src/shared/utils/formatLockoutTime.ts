import type { TFunction } from 'i18next';

export function formatLockoutTime(remainingSeconds: number, t: TFunction) {
    const minutes = Math.ceil(remainingSeconds / 60);

    if (minutes >= 60) {
        const hours = Math.ceil(remainingSeconds / 3600);
        return t('passcode.lockout.subtitleHours', { count: hours });
    }

    return t('passcode.lockout.subtitleMinutes', { count: minutes });
}
