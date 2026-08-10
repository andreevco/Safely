/* Must stay the first import: it installs the globals the domain packages read at load time. */
import '@safely/web-ui/bootstrap';

import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { buildWebLogger, createWebI18n } from '@safely/web-ui';

import '@safely/web-ui/styles.css';

import { AppProviders } from './app';
import { createDesktopPlatform, getBridge } from './platform';
import { ScaffoldView } from './ScaffoldView';

async function mount(): Promise<void> {
    const container = document.getElementById('root');

    if (!container) {
        throw new Error('Renderer root element is missing in index.html');
    }

    const bridge = getBridge();
    const [appInfo, isUserPresenceAvailable] = await Promise.all([
        bridge.getAppInfo(),
        bridge.security.isAvailable()
    ]);

    const platform = createDesktopPlatform({ bridge, appInfo, isUserPresenceAvailable });
    const { logger } = buildWebLogger(appInfo.environment === 'development');

    /* before React mounts: the first config request already carries the language */
    const { instance } = createWebI18n({
        storage: platform.storage.synchronous,
        locale: appInfo.locale
    });

    createRoot(container).render(
        <I18nextProvider i18n={instance}>
            <AppProviders platform={platform} logger={logger}>
                <ScaffoldView />
            </AppProviders>
        </I18nextProvider>
    );
}

void mount();
