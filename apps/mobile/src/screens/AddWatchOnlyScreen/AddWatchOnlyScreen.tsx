import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import {
    BtcAddress,
    BtcXpub,
    PortfolioAlreadyExistsError,
    PortfolioFactory,
    PortfolioMeta,
    PortfolioNetworkType,
    VMType
} from '@safely/core';
import { useAddWatchOnlyPortfolio, useLoader, usePortfolios } from '@safely/ux';

import { handleDuplicatePortfolio } from '@mobile/features/add-wallet/handleDuplicatePortfolio';
import { Button, Screen, Text } from '@mobile/shared/ui';
import { Icon, XmarkCircle16 } from '@mobile/shared/ui/Icon';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './AddWatchOnlyScreen.styles';

export const AddWatchOnlyScreen = () => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const navigation = useNavigation();
    const portfolios = usePortfolios();
    const { withLoader } = useLoader();
    const { mutateAsync: addWatchOnlyPortfolio } = useAddWatchOnlyPortfolio();

    const inputRef = useRef<TextInput>(null);
    const [address, setAddress] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = address.length > 0;

    useFocusEffect(
        useCallback(() => {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 400);

            return () => clearTimeout(timer);
        }, [])
    );

    const handleClear = useCallback(() => {
        setAddress('');
    }, []);

    const trimmedInput = address.trim();
    const isValidInput = BtcAddress.validate(trimmedInput) || BtcXpub.validate(trimmedInput);
    const hasError = trimmedInput.length >= 20 && !isValidInput;

    styles.useVariants({
        focused: isFocused,
        error: hasError
    });

    const handleNext = useCallback(() => {
        const portfolioId = PortfolioFactory.resolveWatchOnlyId(
            trimmedInput,
            PortfolioNetworkType.MAINNET,
            VMType.BTC
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

                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        value={address}
                        onChangeText={setAddress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={[styles.input, { color: theme.colors.text.primary }]}
                        multiline
                        submitBehavior="submit"
                        returnKeyType="next"
                        onSubmitEditing={isValidInput ? handleNext : undefined}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        placeholder={t('addWallet.watchAccount.placeholder')}
                        placeholderTextColor={theme.colors.text.tertiary}
                    />
                    {hasValue && (
                        <TouchableOpacity
                            hitSlop={12}
                            style={styles.clearButton}
                            onPress={handleClear}
                        >
                            <Icon icon={XmarkCircle16} color="tertiary" />
                        </TouchableOpacity>
                    )}
                </View>

                {hasError && (
                    <Text style={styles.errorText}>
                        {t('addWallet.watchAccount.invalidAddress')}
                    </Text>
                )}

                <View style={styles.infoBox}>
                    <Text variant="bodyM" color="secondary">
                        {t('addWallet.watchAccount.info')}
                    </Text>
                </View>
            </Screen>
        </Screen>
    );
};
