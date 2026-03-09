import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';

import { usePortfolios } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfoliosList } from '@mobile/features/portfolio';
import { Button, Screen } from '@mobile/shared/ui';

import { styles } from './SelectAccountModal.styles';

export const SelectAccountModal = () => {
    const { t } = useTranslation();
    const portfolios = usePortfolios();
    const navigation = useNavigation<RootStackNavigationProp>();

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
                    type="secondary"
                    size="medium"
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddWalletModal')}
                >
                    {t('addWallet.title')}
                </Button>
            </ScrollView>
        </Screen>
    );
};
