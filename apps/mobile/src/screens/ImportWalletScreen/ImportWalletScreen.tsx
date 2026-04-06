import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { useImportSeedPhrase } from '@safely/ux';

import { useAddWalletFlow } from '@mobile/features/add-wallet';
import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './ImportWalletScreen.styles';
import { SeedPhraseInput } from '../../../modules/safely-masked-input/src';

export const ImportWalletScreen = () => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { onMnemonicReady } = useAddWalletFlow();

    const { value, error, isDirty, onChange, handleSubmit } = useImportSeedPhrase({
        onSubmit: mnemonic => {
            void onMnemonicReady(mnemonic);
        }
    });

    const inputRef = useRef<TextInput>(null);
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
                        <SeedPhraseInput
                            value={value}
                            onChangeText={onChange}
                            onFocusChange={setIsFocused}
                            style={styles.textArea}
                            textColor={theme.colors.text.primary}
                            placeholder={t('onboarding.importWallet.placeholder')}
                            placeholderTextColor={theme.colors.text.tertiary}
                            autoFocus
                        />
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
