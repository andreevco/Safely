import type { FC, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppLock } from './AppLock';
import { DevToolsRoute } from './DevToolsRoute';
import { MainRoute } from './MainRoute';
import { OnboardingGuard } from './OnboardingGuard';
import { PasscodeRoute } from './PasscodeRoute';
import { ROUTE } from './routes';
import { WelcomeRoute } from './WelcomeRoute';
import type { PasscodeStorage } from '../entities';

export type AppProps = {
    passcodeStorage: PasscodeStorage;
    devTools: (props: { onClose: () => void }) => ReactNode;
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

export const App: FC<AppProps> = props => {
    const { passcodeStorage, devTools, hasWindowControls, isFullScreen } = props;

    return (
        <AppLock passcodeStorage={passcodeStorage}>
            <MemoryRouter>
                <Routes>
                    <Route element={<OnboardingGuard />}>
                        <Route path={ROUTE.onboarding.welcome}>
                            <Route index element={<WelcomeRoute />} />
                            <Route
                                path="passcode"
                                element={<PasscodeRoute passcodeStorage={passcodeStorage} />}
                            />
                        </Route>

                        <Route
                            path={ROUTE.devTools}
                            element={<DevToolsRoute render={devTools} />}
                        />

                        <Route
                            path={ROUTE.main}
                            element={
                                <MainRoute
                                    hasWindowControls={hasWindowControls}
                                    isFullScreen={isFullScreen}
                                />
                            }
                        />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AppLock>
    );
};
