import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useActiveAccount, useSignOutFromAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './SignOutAccountButton.styles';

export const SignOutAccountButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const accountName = useActiveAccount()!.name;

    const { mutateAsync: _signOutAccount } = useSignOutFromAccount();
    const { mutate: signOutAccount } = useMutation({
        async mutationFn() {
            await _signOutAccount();
            rootNavigation.reset({
                index: 0,
                routes: [{ name: 'WelcomeScreen' }]
            });
        }
    });

    const handleSignOut = () => {
        Alert.alert(
            t('settings.signOutAccount.confirm.title', { name: accountName }),
            t('settings.signOutAccount.confirm.message', { name: accountName }),
            [
                { text: t('settings.signOutAccount.confirm.cancel'), style: 'cancel' },
                {
                    text: t('settings.signOutAccount.confirm.confirm'),
                    style: 'destructive',
                    onPress: () => signOutAccount()
                }
            ]
        );
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
