import type { BrowserWindow } from 'electron';
import { app } from 'electron';
import path from 'node:path';

import { APP_ORIGIN, registerAppProtocol, registerPrivilegedSchemes } from './app-protocol';
import { registerIpcHandlers } from './ipc';
import { useSeparateDevUserData } from './paths';
import { hardenSession, hardenWebContents } from './security';
import { createStores } from './store';
import { revokeTicket } from './user-presence';
import { createMainWindow } from './window';
import { IPC_CHANNEL } from '../shared/ipc';
import type { AppState } from '../shared/ipc';

/* `undefined` in a packaged build — the define is only set while the dev server runs */
const devServerUrl: string | undefined = MAIN_WINDOW_VITE_DEV_SERVER_URL;

const allowedOrigins = devServerUrl ? [new URL(devServerUrl).origin, APP_ORIGIN] : [APP_ORIGIN];

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

function notifyAppState(state: AppState): void {
    mainWindow?.webContents.send(IPC_CHANNEL.appState, state);
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
    window.on('hide', () => {
        /* the next secret access must ask again */
        revokeTicket();
        notifyAppState('background');
    });

    window.on('close', event => {
        /* Closing destroys the renderer, where the sync engine lives. On macOS the app stays
           resident, so hide instead and keep syncing; elsewhere closing means quitting. */
        if (isQuitting || process.platform !== 'darwin') {
            return;
        }

        event.preventDefault();
        window.hide();
    });

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

    /* Tells the window whether a close means "hide" or "really quit". Nothing to flush: the
       store writes through on every mutation. */
    app.on('before-quit', () => {
        isQuitting = true;
    });

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

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}
