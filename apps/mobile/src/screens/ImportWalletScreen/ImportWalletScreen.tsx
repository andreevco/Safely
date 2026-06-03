import { useNativeState } from '@expo/ui/jetpack-compose';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { runOnJS } from 'react-native-worklets';

import { useImportSeedPhrase } from '@safely/ux';

import { usePreventCurrentScreenCapture } from '@mobile/entities/security';
import { useAddWalletFlow } from '@mobile/features/add-wallet';
import { Button, NativeInput, Screen, Text, type NativeInputRef } from '@mobile/shared/ui';
import { maskSeedPhraseInput } from '@mobile/shared/utils';

import { styles } from './ImportWalletScreen.styles';

export const ImportWalletScreen = () => {
    usePreventCurrentScreenCapture();

    const { t } = useTranslation();
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

    const inputRef = useRef<NativeInputRef>(null);

    useFocusEffect(
        useCallback(() => {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 400);

            return () => clearTimeout(timer);
        }, [])
    );

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

                    <NativeInput
                        ref={inputRef}
                        value={text}
                        selection={selection}
                        onChangeText={handleChangeText}
                        error={!!error}
                        placeholder={t('onboarding.importWallet.placeholder')}
                        multiline
                    />

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
