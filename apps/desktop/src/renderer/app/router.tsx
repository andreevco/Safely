import {
    createMemoryHistory,
    createRootRouteWithContext,
    createRoute,
    createRouter
} from '@tanstack/react-router';

import { DevToolsRoute } from './DevToolsRoute';
import { MainRoute } from './MainRoute';
import { OnboardingGuard } from './OnboardingGuard';
import { ROUTE } from './routes';
import { WelcomeRoute } from './WelcomeRoute';

export type RouterContext = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({ component: OnboardingGuard });

const mainRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTE.main,
    component: MainRoute
});

const devToolsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTE.devTools,
    component: DevToolsRoute
});

const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTE.onboarding.welcome,
    component: WelcomeRoute
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
