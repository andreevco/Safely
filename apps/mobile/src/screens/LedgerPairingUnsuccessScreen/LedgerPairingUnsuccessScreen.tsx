import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { LedgerStatusScreen, useLedgerSession } from '@mobile/features/ledger';
import { ExclamationmarkCircle96, Icon } from '@mobile/shared/ui';

export const LedgerPairingUnsuccessScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { getLedgerKit, sessionId, setSessionId } = useLedgerSession();

    const handleRetry = async () => {
        if (sessionId) {
            await getLedgerKit()
                .disconnect({ sessionId })
                .catch(() => {});
            setSessionId(null);
        }

        navigation.dispatch(CommonActions.navigate('LedgerDiscoveryModal'));
    };

    return (
        <LedgerStatusScreen
            media={<Icon icon={ExclamationmarkCircle96} />}
            title={t('addWallet.connectLedger.pairingUnsuccess.title')}
            subtitle={t('addWallet.connectLedger.pairingUnsuccess.subtitle')}
            buttonLabel={t('addWallet.connectLedger.pairingUnsuccess.retry')}
            onButtonPress={handleRetry}
        />
    );
};
