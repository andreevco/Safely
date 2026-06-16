import { useNavigation } from '@react-navigation/core';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TextInput } from 'react-native';
import { View } from 'react-native';

import type { PortfolioMeta } from '@safely/core';
import {
    BtcAddress,
    BtcXpub,
    PortfolioAlreadyExistsError,
    PortfolioNetworkType,
    PortfolioWatchOnlyBtc,
    toPortfolioIdWatchOnly
} from '@safely/core';
import { useAddWatchOnlyPortfolio, useLoader, usePortfolios } from '@safely/ux';

import { handleDuplicatePortfolio } from '@mobile/features/add-wallet/handleDuplicatePortfolio';
import { TEST_ID } from '@mobile/shared/constants';
import { Button, Input, Screen, Text } from '@mobile/shared/ui';

import { styles } from './AddWatchOnlyScreen.styles';

export const AddWatchOnlyScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const portfolios = usePortfolios();
    const { withLoader } = useLoader();
    const { mutateAsync: addWatchOnlyPortfolio } = useAddWatchOnlyPortfolio();

    const inputRef = useRef<TextInput>(null);
    const [address, setAddress] = useState('');

    useFocusEffect(
        useCallback(() => {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 400);

            return () => clearTimeout(timer);
        }, [])
    );

    const trimmedInput = address.trim();
    const isValidAddress = BtcAddress.validate(trimmedInput);
    const isValidPubkey = BtcXpub.validate(trimmedInput);
    const isValidSupportedPubkey = isValidPubkey && /^[XxZz]pub/.test(trimmedInput);

    const isValidInput = isValidAddress || isValidSupportedPubkey;
    const displayError = !isValidInput && trimmedInput.length >= 20;

    const handleNext = useCallback(() => {
        const portfolioId = toPortfolioIdWatchOnly(
            PortfolioWatchOnlyBtc.resolveUserInput(trimmedInput, PortfolioNetworkType.MAINNET)
        );

        const existingPortfolio = portfolios.find(p => p.id.isEq(portfolioId));
        if (existingPortfolio) {
            handleDuplicatePortfolio(
                new PortfolioAlreadyExistsError(existingPortfolio),
                navigation
            );

            return;
        }

        navigation.dispatch(
            CommonActions.navigate('CustomizeWalletModal', {
                hasBackButton: true,
                onSave: async (meta: PortfolioMeta) => {
                    try {
                        await withLoader(async () => {
                            await addWatchOnlyPortfolio({
                                input: trimmedInput,
                                meta
                            });
                        });

                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'TabsNavigator' }]
                            })
                        );
                    } catch (error) {
                        handleDuplicatePortfolio(error, navigation);
                    }
                },
                onCompleteCustomize: () => {
                    navigation.goBack();
                }
            })
        );
    }, [trimmedInput, portfolios, navigation, withLoader, addWatchOnlyPortfolio]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
                <Button
                    testID={TEST_ID.watchOnly.continueButton}
                    type="primary"
                    size="small"
                    style={styles.nextButton}
                    onPress={handleNext}
                    disabled={!isValidInput}
                >
                    {t('common.continue')}
                </Button>
            </Screen.Header>
            <Screen>
                <View style={styles.textContainer}>
                    <Text variant="titleM" textAlign="center">
                        {t('addWallet.watchAccount.title')}
                    </Text>
                    <Text variant="bodyL" color="secondary" textAlign="center">
                        {t('addWallet.watchAccount.subtitle')}
                    </Text>
                </View>

                <Input style={styles.inputWrapper}>
                    <Input.Field
                        testID={TEST_ID.watchOnly.addressInput}
                        ref={inputRef}
                        value={address}
                        onChangeText={setAddress}
                        errored={displayError}
                        withClearButton
                        multiline
                        submitBehavior="submit"
                        returnKeyType="next"
                        onSubmitEditing={isValidInput ? handleNext : undefined}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        placeholder={t('addWallet.watchAccount.placeholder')}
                    />
                    {displayError && (
                        <Input.Description color="accentRed">
                            {t(
                                isValidPubkey && !isValidSupportedPubkey
                                    ? 'addWallet.watchAccount.unsupportedExtendedKey'
                                    : 'addWallet.watchAccount.invalidAddress'
                            )}
                        </Input.Description>
                    )}
                </Input>

                <View style={styles.infoBox}>
                    <Text variant="bodyM" color="secondary">
                        {t('addWallet.watchAccount.info')}
                    </Text>
                </View>
            </Screen>
        </Screen>
    );
};
