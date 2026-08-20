/* Must stay the first import: it installs the globals the domain packages read at load time. */
import './global-polyfills';

import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { createWebI18n } from '@safely/web-ui';

import '@safely/web-ui/styles.css';

import { AppProviders } from './app';
import { platform } from './platform';
import { ScaffoldView } from './ScaffoldView';

const container = document.getElementById('root');

if (!container) {
    throw new Error('Renderer root element is missing in index.html');
}

const { instance } = createWebI18n({
    storage: platform.storage.synchronous,
    fallbackLocale: platform.appInfo.locale
});

createRoot(container).render(
    <I18nextProvider i18n={instance}>
        <AppProviders>
            <ScaffoldView />
        </AppProviders>
    </I18nextProvider>
);
