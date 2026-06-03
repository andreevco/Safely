import { Host, TextInput, useNativeState } from '@expo/ui';
import type { TextInputRef } from '@expo/ui';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { runOnJS } from 'react-native-worklets';

import { useImportSeedPhrase } from '@safely/ux';

import { usePreventCurrentScreenCapture } from '@mobile/entities/security';
import { useAddWalletFlow } from '@mobile/features/add-wallet';
import { Button, Screen, Text } from '@mobile/shared/ui';
import { maskSeedPhraseInput } from '@mobile/shared/utils';

import { styles } from './ImportWalletScreen.styles';

export const ImportWalletScreen = () => {
    usePreventCurrentScreenCapture();

    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { onMnemonicReady } = useAddWalletFlow();

    const { value, error, isDirty, onChange, handleSubmit } = useImportSeedPhrase({
        onSubmit: mnemonic => {
            void onMnemonicReady(mnemonic);
        }
    });

    const text = useNativeState(value);
    const selection = useNativeState({ start: 0, end: 0 });

    const handleChangeText = useCallback(
        (newValue: string) => {
            'worklet';
            const masked = maskSeedPhraseInput(newValue, selection.value);
            text.value = masked.value;
            if (masked.changed) {
                selection.value = masked.selection;
            }
            runOnJS(onChange)(masked.value);
        },
        [text, selection, onChange]
    );

    const inputRef = useRef<TextInputRef>(null);
    const [isFocused, setIsFocused] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 400);

            return () => clearTimeout(timer);
        }, [])
    );

    styles.useVariants({
        focused: isFocused && !error,
        error: !!error
    });

    const handleContinue = useCallback(() => {
        handleSubmit();
    }, [handleSubmit]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
                <Button
                    type="primary"
                    size="small"
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={!isDirty}
                >
                    {t('common.continue')}
                </Button>
            </Screen.Header>
            <Screen.Scrollable>
                <View style={styles.content}>
                    <View style={styles.textContainer}>
                        <Text variant="titleM" textAlign="center">
                            {t('onboarding.importWallet.title')}
                        </Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('onboarding.importWallet.description')}
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Host matchContents={{ vertical: true }}>
                            <TextInput
                                ref={inputRef}
                                value={text}
                                selection={selection}
                                onChangeText={handleChangeText}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                style={styles.textArea}
                                placeholder={t('onboarding.importWallet.placeholder')}
                                placeholderTextColor={theme.colors.text.tertiary}
                                multiline
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </Host>
                    </View>

                    {error && (
                        <Text variant="bodyM" color="accentRed">
                            {error}
                        </Text>
                    )}
                </View>
            </Screen.Scrollable>
        </Screen>
    );
};
