import { useTranslation } from 'react-i18next';

import { useActiveAccount } from '@safely/ux';

import { useSignOutAccountConfirmation } from '@mobile/features/settings/useSignOutAccountConfirmation';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './SignOutAccountButton.styles';

export const SignOutAccountButton = () => {
    const { t } = useTranslation();
    const accountName = useActiveAccount().meta.name;
    const handleSignOut = useSignOutAccountConfirmation();

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
