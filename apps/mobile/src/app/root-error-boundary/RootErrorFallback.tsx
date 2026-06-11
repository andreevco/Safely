import { reloadAppAsync } from 'expo-modules-core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shareLogs } from '@mobile/shared/logger';
import { Button, Icon, Text, XmarkCircle56 } from '@mobile/shared/ui';

import { styles } from './RootErrorFallback.styles';

export const RootErrorFallback = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.content}>
                <Icon icon={XmarkCircle56} color="tertiary" />

                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('errorBoundary.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('errorBoundary.subtitle')}
                    </Text>
                </View>
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
