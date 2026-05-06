import { useNavigation } from '@react-navigation/native';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsScreen.styles';

export const DevToolsScreen = () => {
    const navigation = useNavigation<SettingsStackNavigationProp>();

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Dev tools</Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Content style={styles.content}>
                <List>
                    <List.Group variant="divided">
                        <Cell onPress={() => navigation.navigate('DevToolsXpubModal')}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Xpub</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>
                        <Cell onPress={() => navigation.navigate('DevToolsLogsModal')}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Logs</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>
                        <Cell onPress={() => navigation.navigate('DevToolsStorageModal')}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Storage Viewer</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>
                    </List.Group>
                </List>
            </Screen.Content>
        </Screen>
    );
};
