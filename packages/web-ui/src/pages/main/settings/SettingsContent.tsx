import type { FC } from 'react';

import { AccountSettings } from './AccountSettings';
import { CurrencySettings } from './CurrencySettings';
import { LanguageSettings } from './LanguageSettings';
import { LegalSettings } from './LegalSettings';
import { SecuritySettings } from './SecuritySettings';
import type { SettingsSection } from './types';

export type SettingsContentProps = {
    section: SettingsSection;
    onAddAccount: () => void;
};

export const SettingsContent: FC<SettingsContentProps> = props => {
    switch (props.section) {
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
