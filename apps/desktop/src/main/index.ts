import type { BrowserWindow } from 'electron';
import { app } from 'electron';
import path from 'node:path';

import { APP_ORIGIN, registerAppProtocol, registerPrivilegedSchemes } from './app-protocol';
import { registerIpcHandlers } from './ipc';
import { useSeparateDevUserData } from './paths';
import { hardenSession, hardenWebContents } from './security';
import { createStores } from './store';
import { createMainWindow } from './window';
import { IPC_CHANNEL } from '../shared/ipc';
import type { AppState } from '../shared/ipc';

/* `undefined` in a packaged build — the define is only set while the dev server runs */
const devServerUrl: string | undefined = MAIN_WINDOW_VITE_DEV_SERVER_URL;

const allowedOrigins = devServerUrl ? [new URL(devServerUrl).origin, APP_ORIGIN] : [APP_ORIGIN];

let mainWindow: BrowserWindow | null = null;

function notifyAppState(state: AppState): void {
    mainWindow?.webContents.send(IPC_CHANNEL.appState, state);
}

function notifyFullScreen(isFullScreen: boolean): void {
    mainWindow?.webContents.send(IPC_CHANNEL.windowFullScreen, isFullScreen);
}

function revealMainWindow(): void {
    if (!mainWindow) {
        mainWindow = attachMainWindow();
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
}

function attachMainWindow(): BrowserWindow {
    const window = createMainWindow(devServerUrl);

    window.on('focus', () => notifyAppState('active'));
    window.on('blur', () => notifyAppState('inactive'));
    window.on('show', () => notifyAppState('active'));
    /* TODO(vault): hiding must lock the vault once it exists (`doc/vault.md`) — it used to revoke
       the user-presence ticket here. */
    window.on('hide', () => notifyAppState('background'));

    window.on('enter-full-screen', () => notifyFullScreen(true));
    window.on('leave-full-screen', () => notifyFullScreen(false));

    window.on('closed', () => {
        mainWindow = null;
    });

    return window;
}

/* Both must happen before the app is ready. */
useSeparateDevUserData();
registerPrivilegedSchemes();
app.enableSandbox();

if (!app.requestSingleInstanceLock()) {
    /* Two renderers would run two sync engines against the same storage. */
    app.quit();
} else {
    app.on('second-instance', revealMainWindow);

    app.on('web-contents-created', (_event, contents) => {
        hardenWebContents(contents, allowedOrigins);
    });

    void app.whenReady().then(() => {
        if (!devServerUrl) {
            registerAppProtocol(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`));
        }

        hardenSession(devServerUrl);
        createStores();
        registerIpcHandlers(() => mainWindow);
        mainWindow = attachMainWindow();
    });

    app.on('activate', revealMainWindow);
}
