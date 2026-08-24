import { useNavigate, useRouteContext } from '@tanstack/react-router';
import type { FC } from 'react';

import { DevToolsPage } from '@safely/web-ui';

import { ROUTE } from './routes';

export const DevToolsRoute: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });
    const navigate = useNavigate();

    return (
        <DevToolsPage
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            onClose={() => void navigate({ to: ROUTE.main, replace: true })}
        />
    );
};
