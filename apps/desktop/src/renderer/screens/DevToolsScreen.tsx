import { useCanGoBack, useNavigate, useRouteContext, useRouter } from '@tanstack/react-router';
import type { FC } from 'react';

import { DevToolsPage } from '@safely/web-ui';

import { ROUTE } from '../shared';

export const DevToolsScreen: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });
    const router = useRouter();
    const navigate = useNavigate();
    const canGoBack = useCanGoBack();

    const close = (): void =>
        canGoBack ? router.history.back() : void navigate({ to: ROUTE.main, replace: true });

    return (
        <DevToolsPage
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            onClose={close}
        />
    );
};
