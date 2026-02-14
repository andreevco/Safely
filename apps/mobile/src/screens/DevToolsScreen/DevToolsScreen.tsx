import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import { useAppContext, useToast } from '@safely/ux';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { TextProps } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';
import { useCopy } from '@mobile/shared/utils/copy';
import { formatTimestamp } from '@mobile/shared/utils/dates';
import { clearDevLogs, getDevLogs, subscribeDevLogs } from '@mobile/shared/utils/devLogger';

import { styles } from './DevToolsScreen.styles';

const levelColorVariant = (level: string): TextProps['color'] => {
    switch (level) {
        case 'warn':
            return 'accentOrange';
        case 'error':
            return 'accentRed';
        default:
            return 'tertiary';
    }
};

export const DevToolsScreen = () => {
    const { t } = useTranslation();
    const { version } = useAppContext();
    const queryClient = useQueryClient();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const copy = useCopy();
    const toast = useToast();

    const logs = useSyncExternalStore(subscribeDevLogs, getDevLogs);

    const handleClearCache = useCallback(() => {
        createMMKV({ id: 'persister' }).clearAll();
        queryClient.clear();
        toast(t('devTools.cacheCleared'));
    }, [queryClient, toast, t]);

    const handleClearLogs = useCallback(() => {
        clearDevLogs();
    }, []);

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button onPress={navigation.goBack}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
                <Screen.Header.Title>{t('devTools.title')}</Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <List style={styles.container}>
                    <List.Title>{t('devTools.appInfo')}</List.Title>
                    <List.Group variant="divided">
                        <Cell>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>{t('devTools.version')}</Cell.Title>
                                    <Cell.Value variant="bodyL" color="tertiary">
                                        {version}
                                    </Cell.Value>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                    </List.Group>
                </List>

                <List style={[styles.container, styles.sectionGap]}>
                    <List.Title>{t('devTools.cache')}</List.Title>
                    <List.Group variant="divided">
                        <Cell onPress={handleClearCache}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>{t('devTools.clearCache')}</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                    </List.Group>
                </List>

                <List style={[styles.container, styles.sectionGap]}>
                    <List.Title>{t('devTools.logs')}</List.Title>
                    {logs.length > 0 && (
                        <List.Group variant="divided">
                            <Cell onPress={handleClearLogs}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>{t('devTools.clearLogs')}</Cell.Title>
                                    </Cell.Row>
                                </Cell.Content>
                            </Cell>
                        </List.Group>
                    )}
                    <List.Group variant="divided">
                        {logs.length === 0 ? (
                            <Cell>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Text variant="bodyM" color="tertiary">
                                            {t('devTools.noLogs')}
                                        </Text>
                                    </Cell.Row>
                                </Cell.Content>
                            </Cell>
                        ) : (
                            logs.map((entry, i) => {
                                const time = formatTimestamp(entry.timestamp);

                                return (
                                    <Cell
                                        key={`${entry.timestamp}-${i}`}
                                        onPress={() => copy(entry.message)}
                                    >
                                        <Cell.Content>
                                            <Text variant="bodyS" color="tertiary">
                                                {time}{' '}
                                                <Text
                                                    variant="bodyS"
                                                    color={levelColorVariant(entry.level)}
                                                >
                                                    [{entry.level.toUpperCase()}]
                                                </Text>
                                            </Text>
                                            <Text variant="bodyS">{entry.message}</Text>
                                        </Cell.Content>
                                    </Cell>
                                );
                            })
                        )}
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
