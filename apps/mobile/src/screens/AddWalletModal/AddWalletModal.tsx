import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AddWalletOptions } from '@mobile/features/add-wallet';
import { Icon, Screen, Text, WalletPlus96 } from '@mobile/shared/ui';

import { styles } from './AddWalletModal.styles';

export const AddWalletScreen = () => {
    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header>
                <View />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <Icon style={styles.icon} icon={WalletPlus96} />
                <View style={styles.textContainer}>
                    <Text variant="titleM" textAlign="center">
                        {t('addWallet.title')}
                    </Text>
                    <Text variant="bodyL" textAlign="center" color="secondary">
                        {t('addWallet.subtitle')}
                    </Text>
                </View>
                <AddWalletOptions />
            </Screen.Content>
        </Screen>
    );
};
