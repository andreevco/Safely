import { setStringAsync } from 'expo-clipboard';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@safely/ux';

export const useCopy = () => {
    const toast = useToast();
    const { t } = useTranslation();

    return useCallback(
        (text: string, message?: string) => {
            setStringAsync(text);
            notificationAsync(NotificationFeedbackType.Success);
            toast({ message: message ?? t('actions.copied') });
        },
        [toast]
    );
};
