import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import type { SyncedStorageSchema } from '@safely/sync-storage';
import { useActiveAccount } from '@safely/ux';

import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './DevToolsSyncStorageScreen.styles';

type SyncStorageKey = keyof SyncedStorageSchema;

type DevToolsSyncStorageParams = { key: SyncStorageKey };

type DevToolsSyncStorageScreenProps = StaticScreenProps<DevToolsSyncStorageParams | undefined>;

type StackNavigation = NativeStackNavigationProp<{
    DevToolsSyncStorageModal: DevToolsSyncStorageParams | undefined;
}>;

function describeValue(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'item' : 'items'}`;
    if (typeof value === 'object') return `${Object.keys(value).length} keys`;
    return typeof value;
}

function formatValue(value: unknown): string {
    if (value === undefined) return 'undefined';
    return JSON.stringify(value, null, 2);
}

export const DevToolsSyncStorageScreen = (props: DevToolsSyncStorageScreenProps) => {
    const params = props.route.params;
    const copy = useCopy();
    const navigation = useNavigation<StackNavigation>();
    const { syncProvider } = useActiveAccount();

    const keys = Object.keys(syncProvider.getAll()) as SyncStorageKey[];
    const value = params ? syncProvider.get(params.key) : undefined;

    const openKey = useCallback(
        (key: SyncStorageKey) => {
            navigation.push('DevToolsSyncStorageModal', { key });
        },
        [navigation]
    );

    const title = params ? params.key : 'Sync Storage';
    const formatted = params ? formatValue(value) : '';

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS" numberOfLines={1}>
                        {title}
                    </Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Scrollable contentContainerStyle={styles.content}>
                {!params ? (
                    <List>
                        <List.Title>{`Keys (${keys.length})`}</List.Title>
                        <List.Group variant="divided">
                            {keys.length === 0 ? (
                                <Cell>
                                    <Cell.Content>
                                        <Cell.Row>
                                            <Cell.Subtitle>Empty</Cell.Subtitle>
                                        </Cell.Row>
                                    </Cell.Content>
                                </Cell>
                            ) : (
                                keys.map(key => (
                                    <Cell key={key} onPress={() => openKey(key)}>
                                        <Cell.Content>
                                            <Cell.Row>
                                                <Cell.Title>{key}</Cell.Title>
                                            </Cell.Row>
                                            <Cell.Row>
                                                <Cell.Subtitle>
                                                    {describeValue(syncProvider.get(key))}
                                                </Cell.Subtitle>
                                            </Cell.Row>
                                        </Cell.Content>
                                        <Cell.Chevron />
                                    </Cell>
                                ))
                            )}
                        </List.Group>
                    </List>
                ) : (
                    <List>
                        <List.Group variant="divided">
                            <Cell onPress={() => copy(formatted)}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Subtitle
                                            numberOfLines={0}
                                            color="primary"
                                            style={styles.value}
                                        >
                                            {formatted}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                            </Cell>
                        </List.Group>
                    </List>
                )}
            </Screen.Scrollable>
        </Screen>
    );
};
