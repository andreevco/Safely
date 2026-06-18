import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { IDerivation, PortfolioLedger } from '@safely/core';
import { useHideDerivation, useToast } from '@safely/ux';

import { Button, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './RemoveWalletSheet.styles';

type HideDerivationContentProps = {
    portfolio: PortfolioLedger;
    derivation: IDerivation;
};

export const HideDerivationContent = (props: HideDerivationContentProps) => {
    const { portfolio, derivation } = props;

    const toast = useToast();
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const navigation = useNavigation();
    const { mutateAsync: hideDerivation, isPending } = useHideDerivation();

    const name = derivation.name ?? t('portfolio.ledgerWallet', { number: derivation.index + 1 });

    const handleHide = async () => {
        try {
            await hideDerivation({ portfolio, derivationIndex: derivation.index });
            toast(t('removeWallet.toastMessages.walletRemoved'));
            navigation.goBack();
        } catch {
            // Security check cancelled
        }
    };

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('removeWallet.hideDerivation.title', { name })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary" style={styles.subtitle}>
                    {t('removeWallet.hideDerivation.subtitle')}
                </Text>
            </View>

            <View style={styles.footer}>
                <Button type="destructive" size="large" disabled={isPending} onPress={handleHide}>
                    {t('removeWallet.hideDerivation.button')}
                </Button>
                <Button type="secondary" size="large" onPress={close}>
                    {t('removeWallet.cancelButton')}
                </Button>
            </View>
        </View>
    );
};
