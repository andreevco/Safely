import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PortfolioType } from '@safely/core';
import { useActivePortfolioEntitiesQuery, useDeletePortfolio, useToast } from '@safely/ux';

import { BottomSheet, Button, ConfirmCheckbox, Text, useBottomSheet } from '@mobile/shared/ui';

import { HideDerivationContent } from './HideDerivationContent';
import { styles } from './RemoveWalletSheet.styles';
import { useRemoveWalletState } from './useRemoveWalletState';

const RemoveWalletContent = () => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const entities = useRef(useActivePortfolioEntitiesQuery().data!).current;
    const portfolio = entities.portfolio;
    const isLedgerDevice = portfolio.type === PortfolioType.LEDGER;
    const toast = useToast();
    const { mutateAsync: deletePortfolio, isPending: isDeleting } = useDeletePortfolio();
    const navigation = useNavigation();
    const state = useRemoveWalletState(portfolio, isLedgerDevice);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const walletsCount =
        portfolio.type === PortfolioType.LEDGER ? portfolio.getDerivations().length : 0;

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

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t(state.titleKey, { name: portfolio.meta.name })}
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
                    disabled={(state.hasCheckbox && !isConfirmed) || isDeleting}
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

const RemoveWalletDispatch = ({ derivationIndex }: { derivationIndex?: number }) => {
    const entities = useRef(useActivePortfolioEntitiesQuery().data!).current;
    const portfolio = entities.portfolio;

    if (portfolio.type === PortfolioType.LEDGER && derivationIndex !== undefined) {
        const derivation = portfolio.getDerivations().find(item => item.index === derivationIndex);

        if (derivation) {
            return <HideDerivationContent portfolio={portfolio} derivation={derivation} />;
        }
    }

    return <RemoveWalletContent />;
};

type RemoveWalletSheetProps = StaticScreenProps<{ derivationIndex?: number } | undefined>;

export const RemoveWalletSheet = (props: RemoveWalletSheetProps) => {
    return (
        <BottomSheet>
            <RemoveWalletDispatch derivationIndex={props.route.params?.derivationIndex} />
        </BottomSheet>
    );
};
