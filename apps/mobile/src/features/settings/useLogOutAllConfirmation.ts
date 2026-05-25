import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEraseAllData } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

export function useLogOutAllConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const { mutateAsync: eraseAllData } = useEraseAllData();

    return useCallback(() => {
        navigation.navigate('DestructiveConfirmSheet', {
            title: t('logOutAllAccounts.title'),
            message: t('logOutAllAccounts.message'),
            sliderLabel: t('logOutAllAccounts.slider.label'),
            sliderDescription: t('logOutAllAccounts.slider.description'),
            cancelLabel: t('logOutAllAccounts.cancel'),
            onConfirm: eraseAllData
        });
    }, [eraseAllData, navigation, t]);
}
