import { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
    findStorageViewer,
    SINGLE_STORAGE_KEY
} from '@mobile/screens/DevToolsStorageScreen/storages';
import { Button, List, Screen, Text } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './DevToolsStorageValueScreen.styles';

type Props = StaticScreenProps<{
    storageName: string;
    key: string;
}>;

const formatValue = (raw: string): string => {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
};

export const DevToolsStorageValueScreen = ({ route }: Props) => {
    const { storageName, key } = route.params;
    const copy = useCopy();
    const viewer = findStorageViewer(storageName);

    const [value, setValue] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!viewer) return;

        if (viewer.kind === 'single') {
            setValue(viewer.storage.get());
            setLoaded(true);
            return;
        }

        let cancelled = false;
        viewer.storage
            .getItem(key)
            .then(v => {
                if (cancelled) return;
                setValue(v);
                setLoaded(true);
            })
            .catch(e => {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : String(e));
                setLoaded(true);
            });

        return () => {
            cancelled = true;
        };
    }, [viewer, key]);

    const handleCopy = useCallback(() => {
        if (value === null) return;
        copy(value);
    }, [copy, value]);

    const titleKey = viewer?.kind === 'single' ? SINGLE_STORAGE_KEY : key;
    const formatted = value === null ? null : formatValue(value);

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS" numberOfLines={1}>
                        {titleKey}
                    </Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Scrollable contentContainerStyle={styles.content}>
                <List.Title>{storageName}</List.Title>

                {!viewer && (
                    <Text variant="bodyM" color="accentRed">
                        Storage not found
                    </Text>
                )}

                {viewer && error && (
                    <Text variant="bodyM" color="accentRed">
                        {error}
                    </Text>
                )}

                {viewer && !error && !loaded && (
                    <Text variant="bodyM" color="tertiary">
                        Loading…
                    </Text>
                )}

                {viewer && loaded && value === null && !error && (
                    <Text variant="bodyM" color="tertiary">
                        (null)
                    </Text>
                )}

                {viewer && loaded && formatted !== null && (
                    <View style={styles.valueBox}>
                        <Text variant="bodyLMono" color="primary" selectable>
                            {formatted}
                        </Text>
                    </View>
                )}

                <Button
                    type="primary"
                    size="large"
                    style={styles.copyButton}
                    disabled={value === null}
                    onPress={handleCopy}
                >
                    Copy value
                </Button>
            </Screen.Scrollable>
        </Screen>
    );
};
