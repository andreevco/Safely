import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useActiveAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './SignOutAccountButton.styles';

export const SignOutAccountButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const accountName = useActiveAccount()!.name;

    const handleSignOut = () => {
        rootNavigation.navigate('DestructiveConfirmSheet', {
            action: 'signOut'
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
