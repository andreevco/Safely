import { useNavigation } from '@react-navigation/core';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ellipsisMiddle, PortfolioType } from '@safely/core';
import {
    useActivePortfolioEntitiesQuery,
    useActiveWalletMeta,
    useDeletePortfolio,
    useHideDerivation,
    useIsActivePortfolioOverview,
    useToast
} from '@safely/ux';

import { BottomSheet, Button, ConfirmCheckbox, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './RemoveWalletSheet.styles';
import { useRemoveWalletState } from './useRemoveWalletState';

const RemoveWalletContent = () => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const entities = useRef(useActivePortfolioEntitiesQuery().data!).current;
    const portfolio = entities.portfolio;
    const isLedgerDevice = useRef(useIsActivePortfolioOverview()).current;
    const activeMeta = useActiveWalletMeta();
    const toast = useToast();
    const { mutateAsync: hideDerivation, isPending: isHiding } = useHideDerivation();
    const { mutateAsync: deletePortfolio, isPending: isDeleting } = useDeletePortfolio();
    const navigation = useNavigation();
    const state = useRemoveWalletState(portfolio, isLedgerDevice);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const isLedgerDerivation = portfolio.type === PortfolioType.LEDGER && !isLedgerDevice;
    const walletsCount =
        portfolio.type === PortfolioType.LEDGER ? portfolio.getDerivations().length : 0;
    const address = entities.type === 'bip39' ? ellipsisMiddle(entities.btcWallet.address) : '';

    const handleRemove = async () => {
        if (isLedgerDerivation && entities.type === 'bip39') {
            if (walletsCount <= 1) {
                toast(t('ledgerOverview.cannotRemoveLast'));
                return;
            }

            await hideDerivation({ portfolio, derivationIndex: entities.derivation.index });
            toast(t('removeWallet.toastMessages.walletRemoved'));
            navigation.goBack();
            return;
        }

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

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t(state.titleKey, { name: activeMeta.name, address })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary" style={styles.subtitle}>
                    {t(state.subtitleKey, { count: walletsCount })}{' '}
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
                    disabled={(state.hasCheckbox && !isConfirmed) || isDeleting || isHiding}
                    onPress={handleRemove}
                >
                    {t(state.buttonKey)}
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
