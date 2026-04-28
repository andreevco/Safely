import { styles } from '@mobile/screens/DevToolsScreen/DevToolsScreen.styles';
import { Screen, Text } from '@mobile/shared/ui';

export const DevToolsLogsScreen = () => {
    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Logs</Text>
                </Screen.Header.Title>
            </Screen.Header>
            <Screen.Content style={styles.content}>
                <Text>Ill do it adter the Logger</Text>
            </Screen.Content>
        </Screen>
    );
};
