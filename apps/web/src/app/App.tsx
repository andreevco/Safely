import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { useMemo } from 'react';

import { AppContext, IAppContext, createPersister, QueryProvider } from '@safely/ux';

import packageJson from '../../package.json';
import { ToastProvider, useToastServiceContext } from './localProviders/ToastProvider';
import { MainPage } from '../pages/MainPage';

const persister = createPersister(window.localStorage);

const rootRoute = createRootRoute();

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <MainPage />
});

const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute])
});

function AppContent() {
    const toastService = useToastServiceContext();

    const appContext = useMemo<IAppContext>(() => {
        return {
            i18n: {
                language: 'en',
                t: (key: string) => key
            },
            sdk: {}, // TODO Implement
            version: packageJson.version,
            build: 'browser',
            toast: toastService
        };
    }, [toastService]);

    return (
        <QueryProvider persister={persister}>
            <AppContext value={appContext}>
                <RouterProvider router={router} />
            </AppContext>
        </QueryProvider>
    );
}

function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;
