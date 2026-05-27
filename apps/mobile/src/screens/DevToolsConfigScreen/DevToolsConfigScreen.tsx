import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useAppContext } from '@safely/ux';

// TODO Find a way to keep on the app level
// eslint-disable-next-line boundaries/element-types
import { mobileLayerSynchronousDevToken } from '@mobile/app/storage';
import { Button, Input, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsConfigScreen.styles';

const ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]/g;

export const DevToolsConfigScreen = () => {
    const { reloadApp } = useAppContext();
    const [token, setToken] = useState(() => mobileLayerSynchronousDevToken.storage.get() ?? '');

    const handleChangeText = useCallback((value: string) => {
        setToken(value.replace(ALPHANUMERIC_REGEX, ''));
    }, []);

    const handleSaveAndReload = useCallback(() => {
        if (token.length > 0) {
            mobileLayerSynchronousDevToken.storage.set(token);
        } else {
            mobileLayerSynchronousDevToken.storage.clear();
        }

        reloadApp();
    }, [token, reloadApp]);

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Dev config</Text>
                </Screen.Header.Title>
            </Screen.Header>

            <Screen.Content style={styles.content}>
                <Input>
                    <Input.Label>Dev token</Input.Label>
                    <Input.Field
                        value={token}
                        onChangeText={handleChangeText}
                        placeholder="Token"
                        autoCapitalize="none"
                        autoCorrect={false}
                        withClearButton
                    />
                </Input>

                <View style={styles.reloadButton}>
                    <Button type="primary" size="large" onPress={handleSaveAndReload}>
                        Save and reload
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
