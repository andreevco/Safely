import { RouterProvider } from '@tanstack/react-router';
import type { FC } from 'react';

import type { PasscodeStorage } from '@safely/web-ui';
import { PasscodeStorageProvider } from '@safely/web-ui';

import { AppLock } from './AppLock';
import { router } from './router';

export type AppProps = {
    passcodeStorage: PasscodeStorage;
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

export const App: FC<AppProps> = props => {
    const { passcodeStorage, hasWindowControls, isFullScreen } = props;

    return (
        <PasscodeStorageProvider storage={passcodeStorage}>
            <AppLock>
                <RouterProvider router={router} context={{ hasWindowControls, isFullScreen }} />
            </AppLock>
        </PasscodeStorageProvider>
    );
};
