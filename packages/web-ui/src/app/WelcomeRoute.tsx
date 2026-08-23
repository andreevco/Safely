import type { FC } from 'react';
import { useNavigate } from 'react-router';

import { useBootConfig, useLinking } from '@safely/ux';

import { ROUTE } from './routes';
import { WelcomePage } from '../pages';

export const WelcomeRoute: FC = () => {
    const navigate = useNavigate();
    const { openURL } = useLinking();
    const legal = useBootConfig().references.legal;

    return (
        <WelcomePage
            onCreateWallet={() => void navigate(ROUTE.onboarding.passcode)}
            onImportWallet={() => undefined}
            onMoreOptions={() => undefined}
            onLinkWithQr={() => undefined}
            onOpenTerms={() => openURL(legal.terms_url)}
            onOpenPrivacy={() => openURL(legal.privacy_url)}
        />
    );
};
