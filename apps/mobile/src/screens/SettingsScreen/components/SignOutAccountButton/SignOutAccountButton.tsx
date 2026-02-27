import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useActiveAccount, useDeleteAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './SignOutAccountButton.styles';

export const SignOutAccountButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const accountName = useActiveAccount().meta.name;
    const { mutateAsync: signOutAccount } = useDeleteAccount();

    const handleSignOut = () => {
        rootNavigation.navigate('DestructiveConfirmSheet', {
            title: t('settings.signOutAccount.confirm.title'),
            message: t('settings.signOutAccount.confirm.message'),
            sliderLabel: t('settings.signOutAccount.confirm.slider.label'),
            sliderDescription: t('settings.signOutAccount.confirm.slider.description'),
            cancelLabel: t('settings.signOutAccount.confirm.cancel'),
            onConfirm: async () => {
                await signOutAccount();
                rootNavigation.reset({
                    index: 0,
                    routes: [{ name: 'WelcomeScreen' }]
                });
            }
        });
    };

    return (
        <List.Group>
            <Cell style={styles.cell} onPress={handleSignOut}>
                <Cell.Content>
                    <Cell.Row>
                        <Text variant="labelL" style={styles.text}>
                            {t('settings.signOutAccount.title', { name: accountName })}
                        </Text>
                    </Cell.Row>
                </Cell.Content>
            </Cell>
        </List.Group>
    );
};
