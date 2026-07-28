import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import {
    useHomeScreenAmountOrder,
    useSetHomeScreenAmountOrder,
    useSetTransactionHistoryAmountOrder,
    useTransactionHistoryAmountOrder
} from '@safely/ux';

import { Screen, Text } from '@mobile/shared/ui';
import { Icon, Xmark16 } from '@mobile/shared/ui/Icon';

import { styles } from './AmountDisplayScreen.styles';
import {
    AmountOrderSection,
    FullSentAmountSection,
    HomeScreenPreview,
    TransactionHistoryPreview
} from './components';

export const AmountDisplayScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const homeScreenOrder = useHomeScreenAmountOrder();
    const setHomeScreenOrder = useSetHomeScreenAmountOrder();

    const transactionHistoryOrder = useTransactionHistoryAmountOrder();
    const setTransactionHistoryOrder = useSetTransactionHistoryAmountOrder();

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>{t('amountDisplay.title')}</Screen.Header.Title>
                <Screen.Header.Button onPress={() => navigation.getParent()?.goBack()}>
                    <Icon icon={Xmark16} />
                </Screen.Header.Button>
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <AmountOrderSection
                    title={t('amountDisplay.homeScreen.title')}
                    footer={t('amountDisplay.homeScreen.footer')}
                    order={homeScreenOrder}
                    onSelect={setHomeScreenOrder}
                >
                    <HomeScreenPreview />
                </AmountOrderSection>
                <AmountOrderSection
                    title={t('amountDisplay.transactionHistory.title')}
                    footer={
                        <>
                            {t('amountDisplay.transactionHistory.footer')}{' '}
                            <Text variant="bodyM" color="secondary">
                                {t('amountDisplay.transactionHistory.footerRates')}
                            </Text>
                        </>
                    }
                    order={transactionHistoryOrder}
                    onSelect={setTransactionHistoryOrder}
                >
                    <TransactionHistoryPreview />
                </AmountOrderSection>
                <FullSentAmountSection />
            </Screen.Scrollable>
        </Screen>
    );
};
