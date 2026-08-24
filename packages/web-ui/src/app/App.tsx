import { RouterProvider } from '@tanstack/react-router';
import type { FC } from 'react';

import { AppLock } from './AppLock';
import { router } from './router';
import type { PasscodeStorage } from '../entities';

export type AppProps = {
    passcodeStorage: PasscodeStorage;
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

export const App: FC<AppProps> = props => {
    const { passcodeStorage, hasWindowControls, isFullScreen } = props;

    return (
        <AppLock passcodeStorage={passcodeStorage}>
            <RouterProvider
                router={router}
                context={{ passcodeStorage, hasWindowControls, isFullScreen }}
            />
        </AppLock>
    );
};
