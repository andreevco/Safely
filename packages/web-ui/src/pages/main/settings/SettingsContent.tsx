import type { FC } from 'react';

import { AccountSettings } from './AccountSettings';
import { CurrencySettings } from './CurrencySettings';
import { LanguageSettings } from './LanguageSettings';
import { LegalSettings } from './LegalSettings';
import { SecuritySettings } from './SecuritySettings';
import type { SettingsSection } from './types';
import { WalletSettings } from './WalletSettings';

export type SettingsContentProps = {
    section: SettingsSection;
    onAddAccount: () => void;
    onSelectWallet: () => void;
    onEditWallet: () => void;
    onRevealRecoveryPhrase: () => void;
    onRemoveWallet: () => void;
};

export const SettingsContent: FC<SettingsContentProps> = props => {
    switch (props.section) {
        case 'wallet':
            return (
                <WalletSettings
                    onSelectWallet={props.onSelectWallet}
                    onEditWallet={props.onEditWallet}
                    onRevealRecoveryPhrase={props.onRevealRecoveryPhrase}
                    onRemoveWallet={props.onRemoveWallet}
                />
            );
        case 'account':
            return <AccountSettings onAddAccount={props.onAddAccount} />;
        case 'security':
            return <SecuritySettings />;
        case 'language':
            return <LanguageSettings />;
        case 'currency':
            return <CurrencySettings />;
        case 'legal':
            return <LegalSettings />;
    }
};
