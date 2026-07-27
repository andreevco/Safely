import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useAppContext } from '@safely/ux';

import { TEST_ID } from '@mobile/shared/constants';
import { useMobileLayerSynchronousGlobalStorage } from '@mobile/shared/storage';
import { Button, Input, Screen, Text } from '@mobile/shared/ui';

import { styles } from './DevToolsConfigScreen.styles';

const ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]/g;

export const DevToolsConfigScreen = () => {
    const { reloadApp } = useAppContext();
    const {
        value: storedToken,
        set: setStoredToken,
        remove: removeStoredToken
    } = useMobileLayerSynchronousGlobalStorage('devToken');
    const {
        value: storedCountryCode,
        set: setStoredCountryCode,
        remove: removeStoredCountryCode
    } = useMobileLayerSynchronousGlobalStorage('devCountryCode');
    const [token, setToken] = useState(() => storedToken ?? '');
    const [countryCode, setCountryCode] = useState(() => storedCountryCode ?? '');

    const handleChangeText = useCallback((value: string) => {
        setToken(value.replace(ALPHANUMERIC_REGEX, ''));
    }, []);

    const handleChangeCountryCode = useCallback((value: string) => {
        setCountryCode(value.replace(ALPHANUMERIC_REGEX, '').toUpperCase());
    }, []);

    const handleSaveAndReload = useCallback(() => {
        if (token.length > 0) {
            setStoredToken(token);
        } else {
            removeStoredToken();
        }

        if (countryCode.length > 0) {
            setStoredCountryCode(countryCode);
        } else {
            removeStoredCountryCode();
        }

        reloadApp();
    }, [
        token,
        countryCode,
        reloadApp,
        setStoredToken,
        removeStoredToken,
        setStoredCountryCode,
        removeStoredCountryCode
    ]);

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

                <Input>
                    <Input.Label>Country code (ISO 3166-1 alpha-2)</Input.Label>
                    <Input.Field
                        testID={TEST_ID.devTools.countryCode}
                        value={countryCode}
                        onChangeText={handleChangeCountryCode}
                        placeholder="e.g. GB"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        withClearButton
                    />
                </Input>

                <View style={styles.reloadButton}>
                    <Button
                        testID={TEST_ID.devTools.saveAndReload}
                        type="primary"
                        size="large"
                        onPress={handleSaveAndReload}
                    >
                        Save and reload
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
