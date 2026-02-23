import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePortfolios } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfoliosList } from '@mobile/features/portfolio';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SelectAccountModal.styles';

export const SelectAccountModal = () => {
    const { t } = useTranslation();
    const portfolios = usePortfolios();
    const [isEditing, setIsEditing] = useState(false);

    const handleIsEditingChange = useCallback(() => {
        setIsEditing(prev => !prev);
    }, [setIsEditing]);

    const handleEditEnd = useCallback(() => {
        setIsEditing(false);
    }, [setIsEditing]);
    const navigation = useNavigation<RootStackNavigationProp>();

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Button onPress={handleIsEditingChange} type="small">
                    <Text textAlign="center" variant="labelM">
                        {isEditing ? t('actions.done') : t('actions.edit')}
                    </Text>
                </Screen.Header.Button>
                <Screen.Header.Title>{t('accounts.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <PortfoliosList
                portfolios={portfolios}
                isEditing={isEditing}
                onSelect={navigation.goBack}
                onEditEnd={handleEditEnd}
                Footer={() => (
                    <Button
                        type="secondary"
                        size="medium"
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddWalletModal')}
                    >
                        {t('addWallet.title')}
                    </Button>
                )}
            />
        </Screen>
    );
};
