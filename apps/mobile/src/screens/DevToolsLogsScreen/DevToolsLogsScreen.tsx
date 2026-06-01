import { FlatList, View } from 'react-native';

import { shareLogs } from '@mobile/shared/logger';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { LogFilters, LogRow } from './components';
import { styles } from './DevToolsLogsScreen.styles';
import { useLogFilters, useLogs } from './hooks';

export const DevToolsLogsScreen = () => {
    const { records, isLoading, reload } = useLogs();
    const { filtered, filterProps } = useLogFilters(records);

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Logs</Text>
                </Screen.Header.Title>
            </Screen.Header>
            <View style={styles.content}>
                <LogFilters {...filterProps} />

                <FlatList
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    data={filtered}
                    keyExtractor={(item, index) => `${item.timestamp}_${index}`}
                    renderItem={({ item }) => <LogRow record={item} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text variant="bodyM" color="secondary">
                                {isLoading ? 'Loading…' : 'No logs'}
                            </Text>
                        </View>
                    }
                />

                <View style={styles.footer}>
                    <Button style={styles.footerButton} type="secondary" onPress={reload}>
                        Refresh
                    </Button>
                    <Button
                        type="primary"
                        style={styles.footerButton}
                        onPress={() => void shareLogs()}
                    >
                        Share
                    </Button>
                </View>
            </View>
        </Screen>
    );
};
