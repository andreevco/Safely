import { useTranslation } from 'react-i18next';

import { LedgerStatusScreen } from '@mobile/features/ledger';
import { ExclamationmarkCircle96, Icon } from '@mobile/shared/ui';

export const LedgerPairingUnsuccessScreen = () => {
    const { t } = useTranslation();

    return (
        <LedgerStatusScreen
            media={<Icon icon={ExclamationmarkCircle96} />}
            title={t('addWallet.connectLedger.pairingUnsuccess.title')}
            subtitle={t('addWallet.connectLedger.pairingUnsuccess.subtitle')}
            buttonLabel={t('addWallet.connectLedger.pairingUnsuccess.retry')}
        />
    );
};
