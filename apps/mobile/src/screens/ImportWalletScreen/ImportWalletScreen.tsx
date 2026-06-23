import { useNativeState } from '@expo/ui/jetpack-compose';
import type { StaticScreenProps } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { runOnJS } from 'react-native-worklets';

import type { PortfolioNetworkType } from '@safely/core';
import { useAppContext, useImportSeedPhrase } from '@safely/ux';

import { useAddWalletFlow } from '@mobile/features/add-wallet';
import { TEST_ID } from '@mobile/shared/constants';
import { Button, NativeInput, Screen, Text, type NativeInputRef } from '@mobile/shared/ui';
import { maskSeedPhraseInput } from '@mobile/shared/utils';

import { styles } from './ImportWalletScreen.styles';
import { CapturePreventionView } from '../../../modules/safely-capture-prevention/src';

type ImportWalletScreenProps = StaticScreenProps<{ networkType: PortfolioNetworkType }>;

export const ImportWalletScreen = (props: ImportWalletScreenProps) => {
    const networkType = props.route.params.networkType;
    const { t } = useTranslation();
    const { logger } = useAppContext();
    const { onMnemonicReady } = useAddWalletFlow();

    const { value, error, isDirty, onChange, handleSubmit } = useImportSeedPhrase({
        onSubmit: mnemonic => {
            void onMnemonicReady(mnemonic, networkType);
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
                    testID={TEST_ID.importWallet.continueButton}
                    type="primary"
                    size="small"
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={!isDirty}
                >
                    {t('common.continue')}
                </Button>
            </Screen.Header>
            <Screen.Content>
                <CapturePreventionView
                    style={styles.captureScreen}
                    onUnsupported={() =>
                        logger.error('[ImportWalletScreen] capture protection unavailable')
                    }
                >
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
                </CapturePreventionView>
            </Screen.Content>
        </Screen>
    );
};
