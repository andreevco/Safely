import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActivePortfolio, useDeletePortfolio, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { BottomSheet, Button, Checkbox, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './RemoveWalletSheet.styles';

// TODO: connect to sync - replace with useSeedRevealInfo() from the other branch
const isSeedRevealed = true;

const RemoveWalletContent = () => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const portfolio = useActivePortfolio();
    const toast = useToast();
    const { mutateAsync: deletePortfolio, isPending } = useDeletePortfolio();
    const navigation = useNavigation<RootStackNavigationProp>();
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleRemove = async () => {
        await deletePortfolio(portfolio);
        toast(t('removeWallet.toastMessages.walletRemoved'));
        navigation.goBack();
    };

    const handleBackUpPress = () => {
        navigation.navigate('RecoveryConfirmSheet');
    };

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('removeWallet.title', { name: portfolio.meta.name })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary" style={styles.subtitle}>
                    {isSeedRevealed
                        ? t('removeWallet.revealed.subtitle')
                        : t('removeWallet.notRevealed.subtitle')}{' '}
                    <Text variant="bodyL" color="link" onPress={handleBackUpPress}>
                        {t('removeWallet.backUpLink')}
                    </Text>
                </Text>
            </View>

            <View style={styles.checkboxRow}>
                <Text variant="bodyM" color="primary" style={styles.checkboxText}>
                    {isSeedRevealed
                        ? t('removeWallet.revealed.checkbox')
                        : t('removeWallet.notRevealed.checkbox')}
                </Text>
                <Checkbox isChecked={isConfirmed} onPress={() => setIsConfirmed(prev => !prev)} />
            </View>

            <View style={styles.footer}>
                <Button
                    type="destructive"
                    size="large"
                    disabled={!isConfirmed || isPending}
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
