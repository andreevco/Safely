import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET } from '@safely/core';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Button, Text } from '@mobile/shared/ui';

import { styles } from './HistoryEmptyPlaceholder.styles';

export const HistoryEmptyPlaceholder = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    const handleReceive = useCallback(() => {
        navigation.navigate('ReceiveAssetModal', { asset: BTC_ASSET });
    }, [navigation]);

    const handleSend = useCallback(() => {
        navigation.navigate('SendAssetModal');
    }, [navigation]);

    return (
        <View style={styles.emptyContainer}>
            <Text variant="titleM">{t('history.empty.title')}</Text>
            <Text variant="bodyL" color="secondary" style={styles.emptySubtitle}>
                {t('history.empty.subtitle')}
            </Text>
            <View style={styles.emptyActions}>
                <Button type="secondary" size="small" onPress={handleReceive}>
                    {t('history.empty.receive')}
                </Button>
                <Button type="secondary" size="small" onPress={handleSend}>
                    {t('history.empty.send')}
                </Button>
            </View>
        </View>
    );
};
