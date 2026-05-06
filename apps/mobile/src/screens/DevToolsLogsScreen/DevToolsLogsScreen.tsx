import { View } from 'react-native';

import { useActiveAccountQuery, useAppContext } from '@safely/ux';

import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsLogsScreen.styles';

export const DevToolsLogsScreen = () => {
    const { loggerRegistry } = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Logs</Text>
                </Screen.Header.Title>
            </Screen.Header>
            <View style={styles.content}>
                <Button
                    size="large"
                    type="primary"
                    onPress={() =>
                        loggerRegistry.shareLogs({ accountId: activeAccount?.accountId })
                    }
                >
                    Share logs
                </Button>
            </View>
        </Screen>
    );
};
