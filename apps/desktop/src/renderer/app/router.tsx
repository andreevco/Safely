import {
    createMemoryHistory,
    createRootRouteWithContext,
    createRoute,
    createRouter
} from '@tanstack/react-router';

import { OnboardingGuard } from './OnboardingGuard';
import { DevToolsScreen, MainScreen, WelcomeScreen } from '../screens';
import { ROUTE } from '../shared';

export type RouterContext = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({ component: OnboardingGuard });

const mainRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTE.main,
    component: MainScreen
});

const devToolsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTE.devTools,
    component: DevToolsScreen
});

const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTE.onboarding.welcome,
    component: WelcomeScreen
});

const routeTree = rootRoute.addChildren([mainRoute, devToolsRoute, welcomeRoute]);

export const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [ROUTE.main] }),
    context: {} as RouterContext
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
