import type { FC } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useHasAccount } from '@safely/ux';

import { ROUTE } from './routes';

export const OnboardingGuard: FC = () => {
    const hasAccount = useHasAccount();
    const { pathname } = useLocation();

    const isOnboardingRoute = pathname.startsWith(ROUTE.onboarding.welcome);

    if (hasAccount && isOnboardingRoute) {
        return <Navigate to={ROUTE.main} replace />;
    }

    if (!hasAccount && !isOnboardingRoute) {
        return <Navigate to={ROUTE.onboarding.welcome} replace />;
    }

    return <Outlet />;
};
