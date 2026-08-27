import type { FC } from 'react';

import { AccountSettings } from './AccountSettings';
import { AddressBookSettings } from './AddressBookSettings';
import { CurrencySettings } from './CurrencySettings';
import { LanguageSettings } from './LanguageSettings';
import { LegalSettings } from './LegalSettings';
import type { SettingsSection } from './types';
import { WalletSettings } from './WalletSettings';
import type { useAccountFlow } from '../../../features';

export type SettingsContentProps = {
    section: SettingsSection;
    account: ReturnType<typeof useAccountFlow>;
};

export const SettingsContent: FC<SettingsContentProps> = ({ section, account }) => {
    switch (section) {
        case 'wallet':
            return <WalletSettings />;
        case 'addressBook':
            return <AddressBookSettings />;
        case 'account':
            return <AccountSettings flow={account} />;
        case 'security':
            /* TODO(security-settings): the app mounts SecuritySettings with its own props */
            return null;
        case 'language':
            return <LanguageSettings />;
        case 'currency':
            return <CurrencySettings />;
        case 'legal':
            return <LegalSettings />;
    }
};
