import type { FC } from 'react';

import { CurrencySettings } from './CurrencySettings';
import { LanguageSettings } from './LanguageSettings';
import { LegalSettings } from './LegalSettings';
import type { SecuritySettingsProps } from './SecuritySettings';
import { SecuritySettings } from './SecuritySettings';
import type { SettingsSection } from './types';

export type SettingsContentProps = {
    section: SettingsSection;
    security?: SecuritySettingsProps;
};

export const SettingsContent: FC<SettingsContentProps> = props => {
    switch (props.section) {
        case 'security':
            /* TODO(security-settings): wired once the section becomes a route of its own */
            return props.security ? <SecuritySettings {...props.security} /> : null;
        case 'language':
            return <LanguageSettings />;
        case 'currency':
            return <CurrencySettings />;
        case 'legal':
            return <LegalSettings />;
    }
};
