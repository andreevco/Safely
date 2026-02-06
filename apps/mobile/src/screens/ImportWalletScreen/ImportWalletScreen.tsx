import { useAddWalletFlow } from '@mobile/features/add-wallet';
import { Button, Screen, Text } from '@mobile/shared/ui';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { useImportSeedPhrase } from '@safely/ux';

import { styles } from './ImportWalletScreen.styles';

export const ImportWalletScreen = () => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { onMnemonicReady } = useAddWalletFlow();

    const { value, error, isDirty, onChange, handleSubmit } = useImportSeedPhrase({
        onSubmit: mnemonic => {
            void onMnemonicReady(mnemonic);
        }
    });

    const handleContinue = useCallback(() => {
        Keyboard.dismiss();
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
                    {t('onboarding.importWallet.continue')}
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

                    <View style={[styles.inputContainer, error && styles.inputContainerError]}>
                        <TextInput
                            value={value}
                            onChangeText={onChange}
                            style={[styles.textArea, { color: theme.colors.text.primary }]}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                            placeholder={t('onboarding.importWallet.placeholder')}
                            placeholderTextColor={theme.colors.text.tertiary}
                            textAlignVertical="top"
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
