import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProvidersList } from '@mobile/features/exchange';
import { Screen, Text } from '@mobile/shared/ui';

import { styles } from './ExchangeModal.styles';

export const ExchangeModal = () => {
    const { t } = useTranslation();
    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <View style={styles.titleContainer}>
                <Text textAlign="center" variant="titleM">
                    {t('exchange.title')}
                </Text>
            </View>
            <ProvidersList />
        </Screen>
    );
};
