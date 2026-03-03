import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSignOutFromAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

export function useSignOutConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const { mutateAsync: signOutAccount } = useSignOutFromAccount();

    return useCallback(() => {
        navigation.navigate('DestructiveConfirmSheet', {
            title: t('settings.signOutAccount.confirm.title'),
            message: t('settings.signOutAccount.confirm.message'),
            sliderLabel: t('settings.signOutAccount.confirm.slider.label'),
            sliderDescription: t('settings.signOutAccount.confirm.slider.description'),
            cancelLabel: t('settings.signOutAccount.confirm.cancel'),
            onConfirm: async () => {
                await signOutAccount();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'WelcomeScreen' }]
                });
            }
        });
    }, [signOutAccount, navigation, t]);
}
