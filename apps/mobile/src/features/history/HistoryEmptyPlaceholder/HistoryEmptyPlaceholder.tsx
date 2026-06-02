import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET } from '@safely/core';

import { Button, Text } from '@mobile/shared/ui';

import { styles } from './HistoryEmptyPlaceholder.styles';

export const HistoryEmptyPlaceholder = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const handleReceive = useCallback(() => {
        navigation.navigate('ReceiveAssetModal', { asset: BTC_ASSET });
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
            </View>
        </View>
    );
};
