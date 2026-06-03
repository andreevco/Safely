import { reloadAppAsync } from 'expo-modules-core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shareLogs } from '@mobile/shared/logger';
import { Button, Text } from '@mobile/shared/ui';

import { styles } from './RootErrorFallback.styles';

export const RootErrorFallback = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }
            ]}
        >
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('errorBoundary.title')}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t('errorBoundary.subtitle')}
                </Text>
            </View>

            <View style={styles.footer}>
                <Button type="primary" size="large" onPress={() => void reloadAppAsync()}>
                    {t('errorBoundary.restartButton')}
                </Button>
                <Button type="secondary" size="large" onPress={() => void shareLogs()}>
                    {t('errorBoundary.shareLogsButton')}
                </Button>
            </View>
        </View>
    );
};
