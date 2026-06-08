import { requireNativeModule } from 'expo-modules-core';

export type InAppBrowserDismissButtonStyle = 'done' | 'close' | 'cancel';

export interface OpenBrowserOptions {
    toolbarColor?: string;
    controlTintColor?: string;
    dismissButtonStyle?: InAppBrowserDismissButtonStyle;
}

export type OpenBrowserResult = { type: 'dismiss' };

interface SafelyInAppBrowserNativeModule {
    isAvailable(): boolean;
    openBrowser(url: string, options: OpenBrowserOptions): Promise<OpenBrowserResult>;
}

const native = requireNativeModule<SafelyInAppBrowserNativeModule>('SafelyInAppBrowser');

export function isAvailable(): boolean {
    return native.isAvailable();
}

export function openBrowser(
    url: string,
    options: OpenBrowserOptions = {}
): Promise<OpenBrowserResult> {
    return native.openBrowser(url, options);
}
