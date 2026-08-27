import { useRouteContext } from '@tanstack/react-router';
import type { FC } from 'react';

import { MainPage } from '@safely/web-ui';

export const MainScreen: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });

    return <MainPage hasWindowControls={hasWindowControls} isFullScreen={isFullScreen} />;
};
