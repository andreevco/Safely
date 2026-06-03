import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Screen, Text } from '@mobile/shared/ui';

import { styles } from './LedgerImportAccountsScreen.styles';

const MOCK_ADDRESSES = ['bc1qxy2…h0wlh', 'bc1q9d4…3tg6a', 'bc1qar0…f5mdq'];

export const LedgerImportAccountsScreen = () => {
    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('addWallet.connectLedger.importAccounts.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('addWallet.connectLedger.importAccounts.subtitle')}
                    </Text>
                </View>
                <View style={styles.list}>
                    {MOCK_ADDRESSES.map(address => (
                        <View key={address} style={styles.row}>
                            <Text variant="bodyM">{address}</Text>
                        </View>
                    ))}
                </View>
            </Screen.Content>
        </Screen>
    );
};
