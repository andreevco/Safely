import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { usePortfolios } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfoliosList } from '@mobile/features/portfolio';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SelectAccountModal.styles';

export const SelectAccountModal = () => {
    const { t } = useTranslation();
    const portfolios = usePortfolios();
    const navigation = useNavigation<RootStackNavigationProp>();

    const handleSelect = () => {
        navigation.goBack();
    };

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Button disabled type="small">
                    <Text textAlign="center" variant="labelM">
                        {t('actions.edit')}
                    </Text>
                </Screen.Header.Button>
                <Screen.Header.Title>{t('accounts.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable>
                <PortfoliosList portfolios={portfolios} onSelect={handleSelect} />
                <Button
                    type="secondary"
                    size="medium"
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddWalletModal')}
                >
                    {t('addWallet.title')}
                </Button>
            </Screen.Scrollable>
        </Screen>
    );
};
