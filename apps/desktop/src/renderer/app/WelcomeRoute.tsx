import { useNavigate } from '@tanstack/react-router';
import type { FC } from 'react';

import { useBootConfig, useLinking } from '@safely/ux';
import { WelcomePage } from '@safely/web-ui';

import { ROUTE } from './routes';

export const WelcomeRoute: FC = () => {
    const navigate = useNavigate();
    const { openURL } = useLinking();
    const legal = useBootConfig().references.legal;

    return (
        <WelcomePage
            onCreateWallet={() => void navigate({ to: ROUTE.onboarding.passcode })}
            onImportWallet={() => undefined}
            onMoreOptions={() => undefined}
            onLinkWithQr={() => undefined}
            onOpenTerms={() => openURL(legal.terms_url)}
            onOpenPrivacy={() => openURL(legal.privacy_url)}
        />
    );
};
