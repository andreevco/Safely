import { useRouteContext } from '@tanstack/react-router';
import type { FC } from 'react';

import { MainPage } from '@safely/web-ui';

import { SecuritySection } from '../features';

export const MainScreen: FC = () => {
    const { hasWindowControls, isFullScreen } = useRouteContext({ from: '__root__' });

    return (
        <MainPage
            hasWindowControls={hasWindowControls}
            isFullScreen={isFullScreen}
            security={<SecuritySection />}
        />
    );
};
