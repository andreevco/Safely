import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';

import { usePortfolios } from '@safely/ux';

import { PortfoliosList } from '@mobile/features/portfolio';
import { TEST_ID } from '@mobile/shared/constants';
import { Button, Screen } from '@mobile/shared/ui';

import { styles } from './SelectAccountModal.styles';

export const SelectAccountModal = () => {
    const { t } = useTranslation();
    const portfolios = usePortfolios();
    const navigation = useNavigation();

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title>{t('accounts.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <PortfoliosList portfolios={portfolios} onSelect={navigation.goBack} />
                <Button
                    testID={TEST_ID.accounts.addWallet}
                    type="secondary"
                    size="small"
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddWalletModal')}
                >
                    {t('addWallet.title')}
                </Button>
            </ScrollView>
        </Screen>
    );
};
