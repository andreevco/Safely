import { useNavigation, useRoute } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LedgerStatusScreen } from '@mobile/features/ledger';
import { Checkmark96, Icon } from '@mobile/shared/ui';

export const LedgerPairingSuccessScreen = () => {
    const route = useRoute();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const device = (route.params as { device?: string })?.device ?? 'Ledger';

    const handlePairingSuccess = useCallback(() => {
        navigation.dispatch(StackActions.replace('LedgerImportAccountsModal'));
    }, [navigation]);

    return (
        <LedgerStatusScreen
            media={<Icon icon={Checkmark96} />}
            title={t('addWallet.connectLedger.pairingSuccess.title')}
            subtitle={t('addWallet.connectLedger.pairingSuccess.subtitle', { device })}
            buttonLabel={t('common.continue')}
            onButtonPress={handlePairingSuccess}
        />
    );
};
