import { useCallback, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { useAppContext, useToast } from '@safely/ux';

import { shareLogs } from '@mobile/shared/logger';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LogSandboxScreen.styles';

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Level[] = ['trace', 'debug', 'info', 'warn', 'error'];

type Preset = { label: string; text: string };

const PRESETS: Preset[] = [
    {
        label: '12-word mnemonic',
        text: 'abandon ability able about above absent absorb abstract absurd abuse access accident'
    },
    {
        label: '24-word mnemonic',
        text: 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual'
    },
    {
        label: 'Private key (64-hex)',
        text: 'Loading key: 5a1f9b3c8e4d2a7f6b0c9e1d3a5f7b2c4e6d8a0f1b3c5e7d9a2f4b6c8e0d1a3f'
    },
    {
        label: 'xprv',
        text: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
    },
    {
        label: 'Bearer token',
        text: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0JeLJYQrKDCMXJPBs'
    },
    {
        label: 'API credential',
        text: 'Request params: api_key=sk_live_51H8j9kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD'
    },
    {
        label: 'No sanitizer',
        text: 'User opened home screen. Balance: 0.12 BTC. Address: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
    }
];

export const LogSandboxScreen = () => {
    const toast = useToast();
    const { theme } = useUnistyles();
    const { logger } = useAppContext();
    const [text, setText] = useState('');

    const handleLog = useCallback(
        (level: Level) => () => {
            const trimmed = text.trim();
            if (!trimmed) return;

            logger[level]('[sandbox]', trimmed);
            setText('');
            toast({ message: 'Log saved!' });
        },
        [logger, text, toast]
    );

    const handlePreset = useCallback(
        (preset: Preset) => () => {
            setText(preset.text);
        },
        []
    );

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>
                    <Text variant="titleS">Log sandbox</Text>
                </Screen.Header.Title>
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.content}>
                <Text variant="labelM" style={styles.label}>
                    Presets
                </Text>
                <View style={styles.presetsRow}>
                    {PRESETS.map(preset => (
                        <Button
                            key={preset.label}
                            type="secondary"
                            size="small"
                            style={styles.presetButton}
                            onPress={handlePreset(preset)}
                        >
                            {preset.label}
                        </Button>
                    ))}
                </View>

                <Text variant="labelM" style={styles.label}>
                    Log payload
                </Text>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    multiline
                    placeholder="Enter any text here"
                    placeholderTextColor={theme.colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    style={styles.input}
                />

                <Text variant="labelM" style={styles.label}>
                    Save level as
                </Text>
                <View style={styles.levelRow}>
                    {LEVELS.map(level => (
                        <Button
                            key={level}
                            type="secondary"
                            size="small"
                            disabled={!text}
                            style={styles.levelButton}
                            onPress={handleLog(level)}
                        >
                            {level.toUpperCase()}
                        </Button>
                    ))}
                </View>

                <Button style={styles.actionsGroup} type="primary" size="large" onPress={shareLogs}>
                    Share logs
                </Button>
            </Screen.Scrollable>
        </Screen>
    );
};
