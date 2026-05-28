import { View } from 'react-native';

import { shareLogs } from '@mobile/shared/logger';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsLogsScreen.styles';

export const DevToolsLogsScreen = () => {
    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Logs</Text>
                </Screen.Header.Title>
            </Screen.Header>
            <View style={styles.content}>
                <Button size="large" type="primary" onPress={() => void shareLogs()}>
                    Share logs
                </Button>
            </View>
        </Screen>
    );
};
