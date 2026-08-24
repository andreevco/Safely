/* Must stay the first import: it installs the globals the domain packages read at load time. */
import './global-polyfills';

import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { App, createWebI18n } from '@safely/web-ui';

import '@safely/web-ui/styles.css';

import { AppProviders } from './app';
import { passcodeStorage, platform, useIsFullScreen } from './platform';

const container = document.getElementById('root');

if (!container) {
    throw new Error('Renderer root element is missing in index.html');
}

const { instance } = createWebI18n({
    storage: platform.storage.synchronous,
    fallbackLocale: platform.appInfo.locale
});

function Root() {
    const isFullScreen = useIsFullScreen();

    return (
        <App
            passcodeStorage={passcodeStorage}
            hasWindowControls={!isFullScreen}
            isFullScreen={isFullScreen}
        />
    );
}

createRoot(container).render(
    <I18nextProvider i18n={instance}>
        <AppProviders>
            <Root />
        </AppProviders>
    </I18nextProvider>
);
