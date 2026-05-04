import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsStorageScreen.styles';
import { StorageViewer, storageViewers } from './storages';

const useStorageCount = (viewer: StorageViewer): number | null => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (viewer.kind === 'single') {
            setCount(viewer.storage.get() === null ? 0 : 1);
            return;
        }

        let cancelled = false;
        viewer.storage
            .getAllKeys()
            .then(keys => {
                if (!cancelled) setCount(keys.length);
            })
            .catch(() => {
                if (!cancelled) setCount(null);
            });

        return () => {
            cancelled = true;
        };
    }, [viewer]);

    return count;
};

const StorageCell = ({ viewer }: { viewer: StorageViewer }) => {
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const count = useStorageCount(viewer);

    return (
        <Cell
            onPress={() =>
                navigation.navigate('DevToolsStorageKeysModal', { storageName: viewer.name })
            }
        >
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title>{viewer.name}</Cell.Title>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle>
                        {viewer.kind} · {count === null ? '…' : `${count} keys`}
                    </Cell.Subtitle>
                </Cell.Row>
            </Cell.Content>
            <Cell.Chevron />
        </Cell>
    );
};

export const DevToolsStorageScreen = () => {
    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Storage Viewer</Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Content style={styles.content}>
                <List>
                    <List.Group variant="divided">
                        {storageViewers.map(viewer => (
                            <StorageCell key={viewer.name} viewer={viewer} />
                        ))}
                    </List.Group>
                </List>
            </Screen.Content>
        </Screen>
    );
};
