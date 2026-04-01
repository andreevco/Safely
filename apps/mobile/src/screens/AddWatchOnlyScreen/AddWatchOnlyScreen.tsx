import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { BtcAddress, PortfolioMeta } from '@safely/core';
import { useAddWatchOnlyPortfolio } from '@safely/ux';
import { useLoader } from '@safely/ux';

import { Button, Screen, Text } from '@mobile/shared/ui';
import { Icon, XmarkCircle16 } from '@mobile/shared/ui/Icon';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './AddWatchOnlyScreen.styles';

export const AddWatchOnlyScreen = () => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const navigation = useNavigation();
    const { withLoader } = useLoader();
    const { mutateAsync: addWatchOnlyPortfolio } = useAddWatchOnlyPortfolio();

    const [address, setAddress] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = address.length > 0;

    const handleClear = useCallback(() => {
        setAddress('');
    }, []);

    const trimmedAddress = address.trim();
    const isValidAddress = BtcAddress.validate(trimmedAddress);
    const hasError = trimmedAddress.length >= 5 && !isValidAddress;

    styles.useVariants({
        focused: isFocused,
        error: hasError
    });

    const handleNext = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate('CustomizeWalletModal', {
                onSave: async (meta: PortfolioMeta) => {
                    await withLoader(async () => {
                        await addWatchOnlyPortfolio({
                            address: address.trim(),
                            meta
                        });
                    });

                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'TabsNavigator' }]
                        })
                    );
                },
                onCompleteCustomize: () => {
                    navigation.goBack();
                }
            })
        );
    }, [address, navigation, withLoader, addWatchOnlyPortfolio]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
                <Button
                    type="primary"
                    size="small"
                    style={styles.nextButton}
                    onPress={handleNext}
                    disabled={!isValidAddress}
                >
                    {t('common.next')}
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
                        value={address}
                        onChangeText={setAddress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={[styles.input, { color: theme.colors.text.primary }]}
                        multiline
                        submitBehavior="submit"
                        returnKeyType="done"
                        onSubmitEditing={isValidAddress ? handleNext : undefined}
                        autoFocus
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
