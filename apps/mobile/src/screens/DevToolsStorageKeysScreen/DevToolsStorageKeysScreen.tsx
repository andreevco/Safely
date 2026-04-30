import { useNavigation, StaticScreenProps } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import {
    findStorageViewer,
    SINGLE_STORAGE_KEY
} from '@mobile/screens/DevToolsStorageScreen/storages';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsStorageKeysScreen.styles';

type Props = StaticScreenProps<{
    storageName: string;
}>;

export const DevToolsStorageKeysScreen = ({ route }: Props) => {
    const { storageName } = route.params;
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const viewer = findStorageViewer(storageName);

    const [keys, setKeys] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!viewer) return;

        if (viewer.kind === 'single') {
            const value = viewer.storage.get();
            setKeys(value === null ? [] : [SINGLE_STORAGE_KEY]);
            return;
        }

        let cancelled = false;
        viewer.storage
            .getAllKeys()
            .then(allKeys => {
                if (cancelled) return;
                setKeys([...allKeys].sort());
            })
            .catch(e => {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : String(e));
            });

        return () => {
            cancelled = true;
        };
    }, [viewer]);

    const handleSelectKey = useCallback(
        (key: string) => {
            navigation.navigate('DevToolsStorageValueModal', {
                storageName,
                key
            });
        },
        [navigation, storageName]
    );

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">{storageName}</Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Scrollable contentContainerStyle={styles.content}>
                {!viewer && (
                    <Text variant="bodyM" color="accentRed" style={styles.statusRow}>
                        Storage not found
                    </Text>
                )}

                {viewer && error && (
                    <Text variant="bodyM" color="accentRed" style={styles.statusRow}>
                        {error}
                    </Text>
                )}

                {viewer && !error && keys === null && (
                    <Text variant="bodyM" color="tertiary" style={styles.statusRow}>
                        Loading…
                    </Text>
                )}

                {viewer && !error && keys?.length === 0 && (
                    <Text variant="bodyM" color="tertiary" style={styles.statusRow}>
                        Storage is empty
                    </Text>
                )}

                {viewer && keys && keys.length > 0 && (
                    <List>
                        <List.Group variant="divided">
                            {keys.map(key => (
                                <Cell key={key} onPress={() => handleSelectKey(key)}>
                                    <Cell.Content>
                                        <Cell.Row>
                                            <Cell.Title numberOfLines={0}>{key}</Cell.Title>
                                        </Cell.Row>
                                    </Cell.Content>
                                    <Cell.Chevron />
                                </Cell>
                            ))}
                        </List.Group>
                    </List>
                )}
            </Screen.Scrollable>
        </Screen>
    );
};
