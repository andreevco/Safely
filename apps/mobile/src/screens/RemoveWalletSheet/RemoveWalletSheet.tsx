import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    getPortfolioDisplayName,
    useActivePortfolio,
    useDeletePortfolio,
    useToast
} from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { BottomSheet, Button, ConfirmCheckbox, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './RemoveWalletSheet.styles';
import { useRemoveWalletState } from './useRemoveWalletState';

const RemoveWalletContent = () => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const portfolio = useActivePortfolio();
    const toast = useToast();
    const { mutateAsync: deletePortfolio, isPending } = useDeletePortfolio();
    const navigation = useNavigation<RootStackNavigationProp>();
    const state = useRemoveWalletState();
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleRemove = async () => {
        try {
            await deletePortfolio(portfolio);
            toast(t('removeWallet.toastMessages.walletRemoved'));
            navigation.goBack();
        } catch {
            // Security check cancelled
        }
    };

    const handleBackUpPress = () => {
        navigation.navigate('RecoveryConfirmSheet');
    };

    const walletDisplayName = getPortfolioDisplayName(portfolio.meta);

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('removeWallet.title', { name: walletDisplayName })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary" style={styles.subtitle}>
                    {t(state.subtitleKey)}{' '}
                    {state.hasBackUpLink && (
                        <Text variant="bodyL" color="link" onPress={handleBackUpPress}>
                            {t('removeWallet.backUpLink')}
                        </Text>
                    )}
                </Text>
            </View>

            {state.hasCheckbox && (
                <ConfirmCheckbox
                    text={t(state.checkboxKey)}
                    isChecked={isConfirmed}
                    onToggle={() => setIsConfirmed(prev => !prev)}
                />
            )}

            <View style={styles.footer}>
                <Button
                    type="destructive"
                    size="large"
                    disabled={(state.hasCheckbox && !isConfirmed) || isPending}
                    onPress={handleRemove}
                >
                    {t('removeWallet.removeButton')}
                </Button>
                <Button type="secondary" size="large" onPress={close}>
                    {t('removeWallet.cancelButton')}
                </Button>
            </View>
        </View>
    );
};

export const RemoveWalletSheet = () => {
    return (
        <BottomSheet>
            <RemoveWalletContent />
        </BottomSheet>
    );
};
